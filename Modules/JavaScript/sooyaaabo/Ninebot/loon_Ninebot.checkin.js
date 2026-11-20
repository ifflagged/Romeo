(() => {
  'use strict';
  const API = 'https://cn-cbu-gateway.ninebot.com/portal/api/user-sign/v2';
  const APP_STATUS = /^https:\/\/cn-cbu-gateway\.ninebot\.com\/app-api\/api\/user-sign\/v2\/my-page\/status(?:\?|$)/;
  const STORAGE_KEY = 'Ninebot.UIDAccounts.v1';
  const TITLE = '九号出行';
  const CONFIG = Object.freeze({
    requestTimeoutMs: 10000,
    runBudgetMs: 85000,
    finishReserveMs: 1000,
    minimumStartMs: 12000,
    getRetryDelayMs: 1000,
    confirmDelayMs: 1500
  });
  let deadline = Infinity;
  let finished = false;

  function done(value) {
    if (finished) return;
    finished = true;
    $done(value);
  }
  function isValidUid(uid) {
    return typeof uid === 'string' && /^[0-9]+$/.test(uid) && /[1-9]/.test(uid);
  }
  function isValidCredential(value) {
    return typeof value === 'string' && value.trim().length > 0 && !/[\r\n\0]/.test(value);
  }
  function singleLine(value) {
    return String(value).replace(/\s*[\r\n]+\s*/g, ' ').trim();
  }
  function log(uid, text) {
    try { console.log(`[${TITLE}] UID[${isValidUid(uid) ? uid : '未获取'}]：${singleLine(text)}`); } catch (_) {}
  }
  function notify(subtitle, text, uid) {
    const body = `UID[${isValidUid(uid) ? uid : '未获取'}]：${singleLine(text)}`;
    try { console.log(`[${TITLE}] ${subtitle} | ${body}`); } catch (_) {}
    try { $notification.post(TITLE, subtitle, body); }
    catch (_) { log(uid, `${subtitle}，无法发送本地通知`); }
  }
  function failure(message, kind, status, retryable) {
    const error = new Error(message);
    error.kind = kind;
    error.status = status || 0;
    error.retryable = retryable === true;
    return error;
  }
  function readAccounts() {
    try {
      const raw = $persistentStore.read(STORAGE_KEY);
      if (raw == null) return Object.create(null);
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error();
      return Object.assign(Object.create(null), data);
    } catch (_) { throw failure('无法读取本地凭证，请重新抓取。', 'storage'); }
  }
  function credentialHeader(headers, names, label) {
    const values = [];
    for (const name of names) {
      const value = headers[name];
      if (value == null || value === '') continue;
      if (!isValidCredential(value)) throw new Error(`${label}格式无效，请重新打开签到页。`);
      const normalized = value.trim();
      if (!values.includes(normalized)) values.push(normalized);
    }
    if (values.length > 1) throw new Error(`${label}请求头存在冲突，未覆盖原凭证，请重新登录后抓取。`);
    return values[0] || '';
  }
  function capture(request) {
    if (!APP_STATUS.test(request.url || '')) return;
    let uid = '';
    try {
      const headers = Object.create(null);
      for (const [name, value] of Object.entries(request.headers || {})) {
        const key = name.toLowerCase();
        if (Object.prototype.hasOwnProperty.call(headers, key) && headers[key] !== value) {
          throw new Error('请求头存在重复冲突，未覆盖原凭证。');
        }
        headers[key] = value;
      }
      uid = typeof headers.uid === 'string' ? headers.uid.trim() : '';
      if (!isValidUid(uid)) throw new Error('签到页请求缺少有效 UID，请重新打开签到页。');
      const authorization = credentialHeader(headers, ['access-token', 'authorization'], '令牌');
      const deviceId = credentialHeader(headers, ['device-id', 'device_id'], '设备 ID');
      if (!authorization || !deviceId) throw new Error('签到页请求缺少令牌或设备 ID，请重新打开签到页。');
      const accounts = readAccounts();
      const conflict = Object.entries(accounts).some(([otherUid, entry]) =>
        otherUid !== uid && entry && typeof entry.authorization === 'string' && entry.authorization.trim() === authorization);
      if (conflict) throw new Error('该令牌已绑定其他 UID，请重新登录后再抓取。');
      const previous = accounts[uid];
      if (previous && previous.authorization === authorization && previous.deviceId === deviceId) {
        notify('获取成功', '签到凭证已保存。', uid);
        return;
      }
      accounts[uid] = { authorization, deviceId };
      if (!$persistentStore.write(JSON.stringify(accounts), STORAGE_KEY)) throw new Error('无法保存本地凭证。');
      notify('获取成功', previous ? '已更新签到凭证。' : '已保存签到凭证。', uid);
    } catch (error) { notify('获取失败', error.message || '无法读写本地凭证。', uid); }
  }
  function remainingMs() { return deadline - Date.now() - CONFIG.finishReserveMs; }
  async function pause(ms) {
    if (remainingMs() < ms + 1000) throw failure('本轮运行时间预算不足，未继续请求，请稍后再次运行。', 'budget');
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  function apiRequest(account, method, endpoint, label, payload, attempt) {
    const available = remainingMs();
    const timeout = Math.min(CONFIG.requestTimeoutMs, available - 500);
    if (timeout < 1000) return Promise.reject(failure('本轮运行时间预算不足，未继续请求，请稍后再次运行。', 'budget'));
    return new Promise((resolve, reject) => {
      const started = Date.now();
      let settled = false;
      let watchdog;
      function settle(error, data, detail) {
        if (settled) return;
        settled = true;
        if (watchdog !== undefined) clearTimeout(watchdog);
        log(account.uid, `${label}，第${attempt || 1}次，${detail}，耗时 ${Date.now() - started}ms`);
        if (error) reject(error); else resolve(data);
      }
      const options = {
        url: `${API}/${endpoint}`,
        timeout,
        'auto-redirect': false,
        'auto-cookie': false,
        insecure: false,
        headers: {
          Accept: 'application/json, text/plain, */*',
          Authorization: account.authorization,
          'Accept-Language': 'zh-CN,zh-Hans;q=0.9',
          'Content-Type': 'application/json',
          Origin: 'https://h5-bj.ninebot.com',
          Referer: 'https://h5-bj.ninebot.com/',
          from_platform_1: '1',
          language: 'zh',
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Segway v6 C 609033420'
        }
      };
      if (payload !== undefined) options.body = JSON.stringify(payload);
      watchdog = setTimeout(() => {
        settle(failure(`${label}连接超时。`, 'network', 0, true), null, '等待响应超时');
      }, timeout + 500);
      try {
        $httpClient[method](options, (error, response, body) => {
          if (settled) return;
          try {
            const status = Number(response && (response.statusCode || response.status));
            if (status === 401 || status === 403) {
              settle(failure(`${label}授权被拒绝（HTTP ${status}），请检查或重新抓取凭证。`, 'auth', status), null, `HTTP ${status}`);
              return;
            }
            if (Number.isInteger(status) && status >= 100 && (status < 200 || status >= 300)) {
              settle(failure(`${label}失败（HTTP ${status}）。`, 'http', status, [502, 503, 504].includes(status)), null, `HTTP ${status}`);
              return;
            }
            if (error || !Number.isInteger(status) || status < 200) {
              settle(failure(`${label}时连接失败或超时。`, 'network', 0, true), null, '连接失败或超时');
              return;
            }
            let data;
            try { data = JSON.parse(body); }
            catch (_) {
              settle(failure(`${label}返回了无效数据。`, 'parse'), null, `HTTP ${status}，JSON 无效`);
              return;
            }
            if (!data || typeof data !== 'object' || Array.isArray(data) || ![0, '0'].includes(data.code)) {
              const code = data && /^-?\d{1,9}$/.test(String(data.code)) ? String(data.code) : '';
              settle(failure(`${label}失败${code ? `（业务码 ${code}）` : ''}。`, 'business'), null, `HTTP ${status}，业务码 ${code || '无法识别'}`);
              return;
            }
            settle(null, data.data, `HTTP ${status}，业务码 0`);
          } catch (_) {
            settle(failure(`${label}响应处理失败。`, 'parse'), null, '响应处理异常');
          }
        });
      } catch (_) {
        settle(failure(`无法发起${label}请求。`, 'client'), null, '请求发起异常');
      }
    });
  }
  async function readStatus(account, maxAttempts) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const data = await apiRequest(account, 'get', `status?t=${Date.now()}`, '查询签到状态', undefined, attempt);
        const status = data && data.currentSignStatus;
        if (![0, 1, '0', '1'].includes(status)) throw failure('返回的签到状态无法识别。', 'parse');
        const days = data.consecutiveDays;
        return { signed: status === 1 || status === '1', days: /^\d{1,9}$/.test(String(days)) ? String(days) : '' };
      } catch (error) {
        if (!error.retryable || attempt === maxAttempts) throw error;
        log(account.uid, `状态查询遇到临时错误，等待 ${CONFIG.getRetryDelayMs}ms 后重试`);
        await pause(CONFIG.getRetryDelayMs);
      }
    }
  }
  function signedMessage(message, state) {
    return state.days ? `${message} 连续签到 ${state.days} 天。` : message;
  }

  async function signAccount(account) {
    const initial = await readStatus(account, 2);
    if (initial.signed) return signedMessage('今日已签到。', initial);
    let signError;
    try {
      await apiRequest(account, 'post', 'sign', '提交签到', { deviceId: account.deviceId });
    } catch (error) {
      if (error.kind === 'auth' || error.kind === 'budget' || error.kind === 'client') throw error;
      signError = error;
      log(account.uid, '提交未获成功响应，不重发 POST，转为查询签到状态');
    }
    let confirmationError;
    for (let round = 0; round < 2; round++) {
      try {
        if (round > 0) {
          log(account.uid, `结果尚未确认，等待 ${CONFIG.confirmDelayMs}ms 后复查`);
          await pause(CONFIG.confirmDelayMs);
        }
        const state = await readStatus(account, round === 0 ? 2 : 1);
        if (state.signed) return signedMessage('今日签到已确认。', state);
        confirmationError = null;
      } catch (error) {
        if (error.kind === 'auth') throw error;
        confirmationError = error;
        if (!error.retryable) break;
      }
    }
    if (confirmationError) {
      const message = signError
        ? `提交结果未知，未重复提交。${signError.message} 最终状态未确认：${confirmationError.message}`
        : `签到接口已返回成功，最终状态未确认：${confirmationError.message}`;
      throw failure(message, 'unconfirmed');
    }
    throw failure(signError
      ? `复查后服务端仍显示今日未签到。${signError.message}`
      : '签到接口已返回成功，但复查后服务端仍显示今日未签到。', 'unsigned');
  }
  async function runSignIn() {
    deadline = Date.now() + CONFIG.runBudgetMs;
    const accounts = Object.entries(readAccounts());
    if (!accounts.length) {
      notify('签到异常', '请先启用抓取凭证，并在九号出行 App 打开签到页。');
      return;
    }
    for (const [uid, storedAccount] of accounts) {
      if (!isValidUid(uid)) {
        notify('签到异常', '本地存储中发现无效 UID，已跳过该账号。');
        continue;
      }
      if (!storedAccount || !isValidCredential(storedAccount.authorization) || !isValidCredential(storedAccount.deviceId)) {
        notify('签到异常', '本地凭证不完整或格式无效，请重新抓取。', uid);
        continue;
      }
      if (remainingMs() < CONFIG.minimumStartMs) {
        notify('签到异常', '本轮运行时间预算不足，该账号未执行，请稍后再次运行。', uid);
        continue;
      }
      const account = { uid, authorization: storedAccount.authorization.trim(), deviceId: storedAccount.deviceId.trim() };
      try { notify('签到成功', await signAccount(account), uid); }
      catch (error) { notify('签到异常', error.message || '签到处理异常，请稍后查询状态。', uid); }
    }
  }
  if (typeof $request !== 'undefined' && $request) {
    try { capture($request); }
    catch (_) { notify('获取失败', '无法读取签到页请求。'); }
    finally { done({}); }
  } else {
    runSignIn()
      .catch(() => notify('签到异常', '无法读取本地凭证，请重新抓取。'))
      .finally(() => done());
  }
})();
