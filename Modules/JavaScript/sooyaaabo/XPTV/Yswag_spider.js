const $ = new Env('XPTV-sources', { logLevel: 'info' })

;(async () => {
    await importRemoteUtils('https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.2.0/crypto-js.min.js', '', 'CryptoJS', 'crypto-js')
    await importRemoteUtils('https://cdn.jsdelivr.net/gh/Yuheng0101/X@main/Utils/cheerio.js', 'createCheerio', 'cheerio')
    await importRemoteUtils('https://cdn.jsdelivr.net/gh/Yuheng0101/X@main/Utils/Buffer.min.js', 'loadBuffer', 'Buffer')

    const URI = new URIs()
    const { url } = $request
    const queryParams = URI.parse(url).query
    const spiderInstance = createSpiderInstance(url)

    await handleRequest(spiderInstance, queryParams)
})().catch((e) => {
    $.logErr(e)
    $.done()
})

function createSpiderInstance(url) {
    switch (true) {
        case url.includes('/bttwo/'):
            return bttwoClass()
        case url.includes('/saohuo/'):
            return saohuoClass()
        case url.includes('/subaibai/'):
            return sbbClass()
        case url.includes('/hjkk/'):
            return hjkkClass()
        case url.includes('/nkvod/'):
            return nkvodClass()
        case url.includes('/anfuns/'):
            return anfunsClass()
        case url.includes('/zeqaht/'):
            return zeqahtClass()
        case url.includes('/mgtimi/'):
            return mgtimiClass()
        case url.includes('/nono/'):
            return nonoClass()
        case url.includes('/zhuiyi/'):
            return zhuiyiClass()
        case url.includes('/bilfun/'):
            return bilfunClass()
        case url.includes('/sx/'):
            return sxClass()
        case url.includes('/xy/'):
            return xyClass()
        case url.includes('/liteapple/'):
            return liteAppleClass()
        case url.includes('/gzys/'):
            return gzysClass()
        case url.includes('/getJSON/'):
            getJSON()
            return null
        default:
            throw new Error('No matching spiderInstance found for the URL: ' + url)
    }
}

function getJSON() {
    const subs = {
        sites: [
            { name: '文才|偽', type: 1, api: `https://ykusu.ykusu/zeqaht/provide/vod` },
            { name: '兩個BT|偽', type: 1, api: `https://ykusu.ykusu/bttwo/provide/vod` },
            { name: '燒火電影|偽', type: 1, api: `https://ykusu.ykusu/saohuo/provide/vod` },
            { name: '素白白影視|偽', type: 1, api: `https://ykusu.ykusu/subaibai/provide/vod` },
            { name: '耐看點播|偽', type: 1, api: `https://ykusu.ykusu/nkvod/api.php/provide/vod` },
            { name: 'anfuns|偽', type: 1, api: `https://ykusu.ykusu/anfuns/provide/vod` },
            { name: '韓劇看看|偽', type: 1, api: `https://ykusu.ykusu/hjkk/provide/vod` },
            { name: 'NO視頻|偽', type: 1, api: `https://ykusu.ykusu/nono/api.php/provide/vod` },
            { name: 'BILFUN|偽', type: 1, api: `https://ykusu.ykusu/bilfun/api.php/provide/vod` },
            { name: '星芽短劇|偽', type: 1, api: `https://ykusu.ykusu/xy/api.php/provide/vod` },
            { name: '小蘋果|偽', type: 1, api: `https://ykusu.ykusu/liteapple/api.php/provide/vod` },
            { name: '瓜子影視|偽', type: 1, api: `https://ykusu.ykusu/gzys/api.php/provide/vod` },
            { name: 'timimg|偽', type: 1, api: `https://vipcj.timizy.top/api.php/provide/vod/from/mgtv` },
        ],
    }
    return $.isQuanX()
        ? $.done({
              status: 'HTTP/1.1 200',
              headers: {
                  'Content-Type': 'application/json;charset=utf-8',
              },
              body: $.toStr(subs),
          })
        : $.done({
              response: {
                  status: 200,
                  headers: {
                      'Content-Type': 'application/json;charset=utf-8',
                  },
                  body: $.toStr(subs),
              },
          })
}

async function handleRequest(spiderInstance, queryParams) {
    const ac = queryParams?.ac || ''
    if (ac === 'list' || ac === '') {
        const res = await spiderInstance.getClassList()
        $.isQuanX()
            ? $.done({ status: 'HTTP/1.1 200', body: res })
            : $.done({
                  response: {
                      status: 200,
                      headers: {
                          'Content-Type': 'text/html;charset=utf-8',
                      },
                      body: res,
                  },
              })
    } else if (ac === 'detail') {
        const ids = queryParams.ids
        const wd = queryParams.wd
        if (ids) {
            const res = await spiderInstance.getVideoDetail(queryParams)
            $.isQuanX()
                ? $.done({ status: 'HTTP/1.1 200', body: res })
                : $.done({
                      response: {
                          status: 200,
                          headers: {
                              'Content-Type': 'text/html;charset=utf-8',
                          },
                          body: res,
                      },
                  })
        } else if (wd) {
            const res = await spiderInstance.searchVideo(queryParams)
            $.isQuanX()
                ? $.done({ status: 'HTTP/1.1 200', body: res })
                : $.done({
                      response: {
                          status: 200,
                          headers: {
                              'Content-Type': 'text/html;charset=utf-8',
                          },
                          body: res,
                      },
                  })
        } else {
            const res = await spiderInstance.getVideoList(queryParams)
            $.isQuanX()
                ? $.done({ status: 'HTTP/1.1 200', body: res })
                : $.done({
                      response: {
                          status: 200,
                          headers: {
                              'Content-Type': 'text/html;charset=utf-8',
                          },
                          body: res,
                      },
                  })
        }
    } else if (ac === 'play') {
        const res = await spiderInstance.getVideoPlayUrl(queryParams)
        const playUrl = $.toObj(res).data
        $.isQuanX()
            ? $.done({ status: 'HTTP/1.1 302', headers: { Location: playUrl } })
            : $.done({
                  response: {
                      status: 302,
                      headers: {
                          Location: playUrl,
                      },
                  },
              })
    }
}

class spider {
    constructor() {
        this.siteName = ''
        this.url = ''
        this.headers = ''
        this.ignoreClassName = ''
    }

    // ac=list
    async getClassList() {
        let backData = {}
        return $.toStr(backData)
    }

    // ac=detail&t=&pg=
    async getVideoList() {
        let backData = {}
        return $.toStr(backData)
    }

    // ac=detail&ids=
    async getVideoDetail() {
        let backData = {}
        return $.toStr(backData)
    }

    // ac=play
    async getVideoPlayUrl() {
        let backData = {}
        return $.toStr(backData)
    }

    // ac=detail&wd=
    async searchVideo() {
        let backData = {}
        return $.toStr(backData)
    }

    combineUrl(url) {
        if (url === undefined) {
            return ''
        }
        if (url.indexOf(this.url) !== -1) {
            return url
        }
        if (url.startsWith('/')) {
            return this.url + url
        }
        return this.url + '/' + url
    }

    isIgnoreClassName(className) {
        return this.ignoreClassName.some((element) => className.includes(element))
    }

    removeTrailingSlash(str) {
        if (str.endsWith('/')) {
            return str.slice(0, -1)
        }
        return str
    }

    msgtodc(e) {
        const webhook = 'https://discord.com/api/webhooks/1052995873270923314/-lua5joiYT63DjGn6H-a_X3srT0MrNfPZDJjLtvcsHJ69fU1gVz2O-Ldc5wcwzEr7uoA'
        const err = {
            time: $.time('yyyy-MM-dd HH:mm:ss'),
            env: $.getEnv(),
            site: this.siteName,
            error: e.message,
        }
        return $.http.post({
            url: webhook,
            body: {
                content: $.toStr(err),
            },
        })
    }
}

function bttwoClass() {
    return new (class extends spider {
        constructor() {
            super()
            this.siteName = '兩個BT'
            // 發布頁 https://bttwo.vip
            this.url = 'https://www.bttwoo.com'
            this.headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
            }
            this.ignoreClassName = ['首页', '热门下载', '公告求片']
        }

        async getClassList() {
            let webUrl = this.url
            let backData = {}
            try {
                const pro = await $.http.get({ url: webUrl, headers: this.headers })

                let proData = pro.body
                if (proData) {
                    let _$ = $.cheerio.load(proData)
                    let allClass = _$('.navlist a')
                    let list = []
                    allClass.each((index, element) => {
                        let isIgnore = this.isIgnoreClassName(_$(element).text())
                        if (isIgnore) {
                            return
                        }
                        let type_name = _$(element).text()
                        let url = _$(element).attr('href') ?? ''

                        url = this.combineUrl(url)

                        if (url.length > 0 && type_name.length > 0) {
                            let videoClass = {}
                            videoClass.type_id = index
                            videoClass.type_name = type_name.trim()
                            list.push(videoClass)
                        }
                    })

                    let allVideo = _$('.mi_btcon')
                    let videos = []
                    allVideo.each((index, element) => {
                        let videoList = _$(element).find('.bt_img ul li')
                        videoList.each((i, e) => {
                            let vodUrl = _$(e).find('a').attr('href') ?? ''
                            let vodPic = _$(e).find('img').attr('data-original') ?? ''
                            let vodName = _$(e).find('img').attr('alt') ?? ''
                            let vodDiJiJi = _$(e).find('.jidi span').text() ?? ''

                            let videoDet = {}
                            let match = vodUrl.match(/movie\/(.+)\.html/)
                            if (match) {
                                videoDet.vod_id = +match[1]
                            }
                            videoDet.vod_pic = vodPic
                            videoDet.vod_name = vodName
                            videoDet.vod_remarks = vodDiJiJi.trim()
                            videos.push(videoDet)
                        })
                    })

                    backData = parseClassList(videos, list)
                }
            } catch (e) {
                await this.msgtodc(e)
                $.logErr(e.message)
                backData.error = e.message
            }

            return $.toStr(backData)
        }

        async getVideoList(queryParams) {
            const page = queryParams.pg
            const type = queryParams.t
            let realTypeName = ''
            if (type === '') return this.getClassList()
            switch (type) {
                case '1':
                    realTypeName = '/new-movie'
                    break
                case '3':
                    realTypeName = '/hot-month'
                    break
                case '4':
                    realTypeName = '/zgjun'
                    break
                case '5':
                    realTypeName = '/meiju'
                    break
                case '6':
                    realTypeName = '/jpsrtv'
                    break
            }
            let listUrl = this.removeTrailingSlash(this.url) + realTypeName + '/page/' + page.toString()
            let backData = {}
            try {
                let pro = await $.http.get({ url: listUrl, headers: this.headers })

                let proData = pro.body
                if (proData) {
                    let _$ = $.cheerio.load(proData)
                    let allVideo = _$('div.bt_img > ul').find('li')
                    let lastPage = _$('.pagenavi_txt a[title="跳转到最后一页"]').attr('href')
                    if (lastPage) {
                        let parts = lastPage.split('/')
                        lastPage = parts[parts.length - 1]
                    } else {
                        lastPage = '1'
                    }
                    let videos = []
                    allVideo.each((index, element) => {
                        let vodUrl = _$(element).find('.dytit a').attr('href') || ''
                        let vodPic = _$(element).find('.thumb').attr('data-original') || ''
                        let vodName = _$(element).find('.dytit').text() || ''
                        let vodDiJiJi = _$(element).find('.jidi span').text() || ''

                        let videoDet = {}
                        videoDet.vod_id = +vodUrl.match(/movie\/(.+)\.html/)[1]
                        videoDet.vod_pic = vodPic
                        videoDet.vod_name = vodName
                        videoDet.vod_remarks = vodDiJiJi.trim()
                        videos.push(videoDet)
                    })

                    backData = parseVideoList(videos, page, lastPage)
                }
            } catch (e) {
                await this.msgtodc(e)
                $.logErr('Error fetching list:', e)
                backData.error = e.message
            }
            return $.toStr(backData)
        }

        async getVideoDetail(queryParams) {
            const ids = queryParams.ids
            let backData = {}
            try {
                let webUrl = this.url + `/movie/${ids}.html`
                let pro = await $.http.get({ url: webUrl, headers: this.headers })
                let proData = pro.body
                if (proData) {
                    let _$ = $.cheerio.load(proData)
                    let juJiDocument = _$('.paly_list_btn').find('a')

                    let vod_play_url = ''
                    juJiDocument.each((index, element) => {
                        vod_play_url += _$(element).text()
                        vod_play_url += '$'
                        vod_play_url += 'https://ykusu.ykusu/bttwo/provide/vod?ac=play&url=' + encodeURIComponent(_$(element).attr('href')) + '&n=.m3u8'
                        vod_play_url += '#'
                    })

                    backData = parseVideoDetail(+ids, '', '', '', vod_play_url)
                }
            } catch (e) {
                await this.msgtodc(e)
                $.logErr(e)
                backData.error = e.message
            }

            return $.toStr(backData)
        }

        async getVideoPlayUrl(queryParams) {
            let backData = {}
            let url = decodeURIComponent(queryParams.url)

            try {
                let html = await $.http.get({ url: url, headers: this.headers })

                let data = html.body
                if (data) {
                    let isPlayable = data.split('window.wp_nonce=')[1]
                    if (isPlayable) {
                        let text = isPlayable.split('eval')[0]
                        let code = text.match(/var .*?=.*?"(.*?)"/)[1]
                        let key = text.match(/var .*?=md5.enc.Utf8.parse\("(.*?)"/)[1]
                        let iv = text.match(/var iv=.*?\((\d+)/)[1]

                        text = this.aesCbcDecode(code, key, iv)
                        let playurl = text.match(/url: "(.*?)"/)[1]

                        backData.data = playurl
                    } else {
                        $.msg('該片在線播放需要兩個BT的VIP會員')
                        backData.data = 'https://shattereddisk.github.io/rickroll/rickroll.mp4'
                    }
                } else backData.data = 'https://shattereddisk.github.io/rickroll/rickroll.mp4'
            } catch (e) {
                await this.msgtodc(e)
                $.logErr(e)
                backData.error = e.message
            }
            return $.toStr(backData)
        }

        async searchVideo(queryParams) {
            const pg = queryParams.pg
            const wd = queryParams.wd
            let backData = {}
            let url = this.removeTrailingSlash(this.url) + `/xssssearch?q=${wd}$f=_all&p=${pg}`

            try {
                let pro = await $.http.get({ url: url, headers: this.headers })
                let proData = pro.body
                if (proData) {
                    let _$ = $.cheerio.load(proData)
                    let allVideo = _$('div.bt_img > ul').find('li')
                    let videos = []
                    allVideo.each((index, element) => {
                        let vodUrl = _$(element).find('.dytit a').attr('href') || ''
                        let vodPic = _$(element).find('.thumb').attr('data-original') || ''
                        let vodName = _$(element).find('.dytit').text() || ''
                        let vodDiJiJi = _$(element).find('.jidi span').text() || ''

                        let videoDet = {}
                        videoDet.vod_id = +vodUrl.match(/movie\/(.+)\.html/)[1]
                        videoDet.vod_pic = vodPic
                        videoDet.vod_name = vodName
                        videoDet.vod_remarks = vodDiJiJi.trim()
                        videos.push(videoDet)
                    })

                    backData = parseVideoList(videos, pg, '1')
                }
            } catch (e) {
                await this.msgtodc(e)
                $.logErr(e)
                backData.error = e.message
            }

            return $.toStr(backData)
        }

        aesCbcDecode(ciphertext, key, iv) {
            const encryptedHexStr = $.CryptoJS.enc.Base64.parse(ciphertext)
            const encryptedBase64Str = $.CryptoJS.enc.Base64.stringify(encryptedHexStr)

            const keyHex = $.CryptoJS.enc.Utf8.parse(key)
            const ivHex = $.CryptoJS.enc.Utf8.parse(iv)

            const decrypted = $.CryptoJS.AES.decrypt(encryptedBase64Str, keyHex, {
                iv: ivHex,
                mode: $.CryptoJS.mode.CBC,
                padding: $.CryptoJS.pad.Pkcs7,
            })

            const plaintext = decrypted.toString($.CryptoJS.enc.Utf8)
            return plaintext
        }
    })()
}

function saohuoClass() {
    return new (class extends spider {
        constructor() {
            super()
            this.siteName = '燒火'
            this.url = 'https://saohuo.tv'
            this.headers = {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36',
            }
            this.ignoreClassName = ['最近更新', '排行榜']
        }

        async getClassList() {
            let webUrl = this.url
            let backData = {}
            try {
                const pro = await $.http.get({ url: webUrl, headers: this.headers })

                let proData = await pro.body
                if (proData) {
                    let _$ = $.cheerio.load(proData)
                    let allClass = _$('nav.top_bar > a')
                    let list = []
                    allClass.each((index, element) => {
                        let isIgnore = this.isIgnoreClassName(_$(element).text())
                        if (isIgnore) {
                            return
                        }
                        let type_name = _$(element).text()
                        let url
                        if (type_name === '动漫') {
                            url = '/list/4.html'
                        } else url = _$(element).attr('href') || ''

                        url = url.match(/list\/(.*)\.html/)[1]

                        if (url.length > 0 && type_name.length > 0) {
                            let videoClass = {}
                            videoClass.type_id = +url
                            videoClass.type_name = type_name.trim()
                            list.push(videoClass)
                        }

                        if (type_name === '电影') {
                            let cat = [
                                { type_id: 6, type_name: '喜剧' },
                                { type_id: 7, type_name: '爱情' },
                                { type_id: 8, type_name: '恐怖' },
                                { type_id: 9, type_name: '动作' },
                                { type_id: 10, type_name: '科幻' },
                                { type_id: 11, type_name: '战争' },
                                { type_id: 12, type_name: '犯罪' },
                                { type_id: 13, type_name: '动画' },
                                { type_id: 14, type_name: '奇幻' },
                                { type_id: 15, type_name: '剧情' },
                                { type_id: 16, type_name: '冒险' },
                                { type_id: 17, type_name: '悬疑' },
                                { type_id: 18, type_name: '惊悚' },
                                { type_id: 19, type_name: '其它電影' },
                            ]
                            list.push(...cat)
                        } else if (type_name === '电视剧') {
                            let cat = [
                                { type_id: 20, type_name: '大陆' },
                                { type_id: 21, type_name: 'TVB' },
                                { type_id: 22, type_name: '韩剧' },
                                { type_id: 23, type_name: '美剧' },
                                { type_id: 24, type_name: '日剧' },
                                { type_id: 25, type_name: '英剧' },
                                { type_id: 26, type_name: '台剧' },
                                { type_id: 27, type_name: '其它剧' },
                            ]
                            list.push(...cat)
                        }
                    })

                    let allSection = _$('ul.v_list')
                    let videos = []
                    allSection.each((index, element) => {
                        let allVideo = _$(element).find('.v_img')
                        allVideo.each((index, element) => {
                            let vodUrl = _$(element).find('a').attr('href') || ''
                            let vodPic = _$(element).find('img').attr('data-original') || ''
                            let vodName = _$(element).find('a').attr('title') || ''
                            let vodDiJiJi = _$(element).find('.v_note').text() || ''

                            let videoDet = {}
                            videoDet.vod_id = +vodUrl.match(/movie\/(.+)\.html/)[1]
                            videoDet.vod_pic = vodPic
                            videoDet.vod_name = vodName
                            videoDet.vod_remarks = vodDiJiJi.trim()
                            videos.push(videoDet)
                        })
                    })

                    backData = parseClassList(videos, list)
                }
            } catch (e) {
                await this.msgtodc(e)
                $.logErr(e)
                backData.error = e.message
            }

            return $.toStr(backData)
        }

        async getVideoList(queryParams) {
            let page = queryParams.pg
            let type = queryParams.t

            if (type === '') return this.getClassList()

            let listUrl = this.removeTrailingSlash(this.url) + '/list/' + type + '-' + page.toString() + '.html'
            let backData = {}
            try {
                let pro = await $.http.get({ url: listUrl, headers: this.headers })
                let proData = pro.body
                if (proData) {
                    let _$ = $.cheerio.load(proData)
                    let allVideo = _$('ul.v_list div.v_img')
                    let lastPage = _$('section.page span').text() || ''
                    if (lastPage) {
                        let parts = lastPage.split('/')
                        lastPage = parts[parts.length - 1]
                    } else {
                        lastPage = '1'
                    }
                    let videos = []
                    allVideo.each((index, element) => {
                        let vodUrl = _$(element).find('a').attr('href') || ''
                        let vodPic = _$(element).find('img').attr('data-original') || ''
                        let vodName = _$(element).find('a').attr('title') || ''
                        let vodDiJiJi = _$(element).find('.v_note').text() || ''

                        let videoDet = {}
                        videoDet.vod_id = +vodUrl.match(/movie\/(.+)\.html/)[1]
                        videoDet.vod_pic = vodPic
                        videoDet.vod_name = vodName
                        videoDet.vod_remarks = vodDiJiJi.trim()
                        videos.push(videoDet)
                    })

                    backData = parseVideoList(videos, page, lastPage)
                }
            } catch (e) {
                await this.msgtodc(e)
                $.logErr('Error fetching list:', e)
                backData.error = e.message
            }
            return $.toStr(backData)
        }

        async getVideoDetail(queryParams) {
            let ids = queryParams.ids
            let backData = {}
            try {
                let webUrl = this.url + `/movie/${ids}.html`
                let pro = await $.http.get({ url: webUrl, headers: this.headers })
                let proData = pro.body
                if (proData) {
                    let _$ = $.cheerio.load(proData)

                    let play_from = []
                    _$('ul.from_list')
                        .find('li')
                        .each((i, e) => play_from.push(_$(e).text()))

                    let juJiDocment = _$('#play_link').find('li')
                    let vod_play_url = ''
                    juJiDocment.each((index, element) => {
                        let playLinkList = juJiDocment.eq(index)
                        let playLinks = _$(playLinkList).find('a')
                        let from = play_from[index]

                        // _$(playLinks.reverse()).each((index, element) => {
                        playLinks.each((index, element) => {
                            vod_play_url += from + '-' + _$(element).text()
                            vod_play_url += '$'
                            vod_play_url +=
                                'https://ykusu.ykusu/saohuo/provide/vod?ac=play&url=' + encodeURIComponent(this.url + _$(element).attr('href')) + '&n=.m3u8'
                            vod_play_url += '#'
                        })

                        vod_play_url += '$$$'
                    })

                    backData = parseVideoDetail(+ids, '', '', '', vod_play_url)
                    backData.list[0].vod_play_from = play_from.join('$$$')
                    backData.list[0].vod_play_note = '$$$'
                }
            } catch (e) {
                await this.msgtodc(e)
                $.logErr(e)
                backData.error = e.message
            }

            return $.toStr(backData)
        }

        async getVideoPlayUrl(queryParams) {
            let backData = {}
            let url = decodeURIComponent(queryParams.url)
            try {
                let html = await $.http.get({ url: url, headers: this.headers })

                let proData = html.body
                if (proData) {
                    let _$ = $.cheerio.load(proData)
                    let iframeUrl = _$('iframe').attr('src') || ''
                    let apiurl = iframeUrl ? this.getHostFromURL(iframeUrl) + '/api.php' : ''

                    let resp = await $.http.get({ url: iframeUrl, headers: this.headers })
                    if (resp.body) {
                        let _$2 = $.cheerio.load(resp.body)
                        let respScript = _$2('body script').text()
                        let url = respScript.match(/var url = "(.*)"/)[1]
                        let t = respScript.match(/var t = "(.*)"/)[1]
                        let key = respScript.match(/var key = "(.*)"/)[1]

                        let presp = await $.http.post({
                            url: apiurl,
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded',
                                'User-Agent': this.headers['User-Agent'],
                                Referer: iframeUrl,
                            },
                            body: `url=${url}&t=${t}&key=${key}&act=0&play=1`,
                        })
                        if ($.toObj(presp.body).code !== 200) {
                            $.msg($.toObj(presp.body).msg)
                        } else {
                            let purl = $.toObj(presp.body).url
                            backData.data = /http/.test(purl) ? purl : this.getHostFromURL(iframeUrl) + purl
                        }
                    } else backData.error = 'resp is empty'
                }
            } catch (e) {
                await this.msgtodc(e)
                $.logErr(e)
                backData.error = e.message
            }
            return $.toStr(backData)
        }

        async searchVideo(queryParams) {
            const pg = queryParams.pg
            const wd = queryParams.wd
            let ocrApi = 'https://api.nn.ci/ocr/b64/json'
            let validate = this.url + '/include/vdimgck.php'
            let backData = {}

            try {
                // 搜尋需要通過圖形驗證碼
                let img = await $.http.get({ url: validate, headers: this.headers, 'binary-mode': true })
                let b64 = $.Buffer.from(img.body).toString('base64')
                let ocrRes = await $.http.post({
                    url: ocrApi,
                    headers: { headers: this.headers },
                    body: b64,
                })
                let vd = $.toObj(ocrRes.body).result
                let searchUrl = this.url + '/search.php?scheckAC=check&page=&searchtype=&order=&tid=&area=&year=&letter=&yuyan=&state=&money=&ver=&jq='
                let searchRes = await $.http.post({
                    url: searchUrl,
                    headers: this.headers,
                    body: `searchword=${wd}&validate=${vd}`,
                })
                let _$ = $.cheerio.load(searchRes.body)
                let videos = []
                let allVideo = _$('ul.v_list div.v_img')
                allVideo.each((index, element) => {
                    let vodUrl = _$(element).find('a').attr('href') || ''
                    let vodPic = _$(element).find('img').attr('data-original') || ''
                    let vodName = _$(element).find('a').attr('title') || ''
                    let vodDiJiJi = _$(element).find('.v_note').text() || ''

                    let videoDet = {}
                    videoDet.vod_id = +vodUrl.match(/movie\/(.+)\.html/)[1]
                    videoDet.vod_pic = vodPic
                    videoDet.vod_name = vodName
                    videoDet.vod_remarks = vodDiJiJi.trim()
                    videos.push(videoDet)
                })

                backData = parseVideoList(videos, pg, '1')
            } catch (e) {
                await this.msgtodc(e)
                $.logErr(e)
                backData.error = e.message
            }

            return $.toStr(backData)
        }

        getHostFromURL(url) {
            const protocolEndIndex = url.indexOf('://')
            if (protocolEndIndex === -1) {
                return null
            }
            const hostStartIndex = protocolEndIndex + 3
            const hostEndIndex = url.indexOf('/', hostStartIndex)
            const host = hostEndIndex === -1 ? url.slice(hostStartIndex) : url.slice(hostStartIndex, hostEndIndex)

            return `${url.slice(0, protocolEndIndex + 3)}${host}`
        }
    })()
}

function sbbClass() {
    return new (class extends spider {
        constructor() {
            super()
            this.siteName = '素白白'
            this.url = 'https://www.subaibaiys.com'
            this.headers = {
                'User-Agent':
                    'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
            }
            this.ignoreClassName = ['首页', '公告留言']
        }

        async getClassList() {
            let webUrl = this.url
            let backData = {}
            try {
                const pro = await $.http.get({ url: webUrl, headers: this.headers })

                let proData = await pro.body
                if (proData) {
                    let _$ = $.cheerio.load(proData)
                    let allClass = _$('ul.navlist a')
                    let list = []
                    allClass.each((index, element) => {
                        let isIgnore = this.isIgnoreClassName(_$(element).text())
                        if (isIgnore) {
                            return
                        }
                        let type_name = _$(element).text()
                        let url = _$(element).attr('href') || ''

                        if (url.length > 0 && type_name.length > 0) {
                            let videoClass = {}
                            videoClass.type_id = index
                            videoClass.type_name = type_name.trim()
                            list.push(videoClass)
                        }
                    })

                    let allVideo = _$('.mi_cont .mi_btcon')
                    let videos = []
                    allVideo.each((index, element) => {
                        let nodes = _$(element).find('.bt_img ul li')
                        nodes.each((index, element) => {
                            let vodUrl = _$(element).find('a').attr('href') || ''
                            let vodPic = _$(element).find('img').attr('data-original') || ''
                            let vodName = _$(element).find('img').attr('alt') || ''
                            let vodDiJiJi = _$(element).find('.jidi').text() || ''

                            let videoDet = {}
                            videoDet.vod_id = +vodUrl.match(/movie\/(.+)\.html/)[1]
                            videoDet.vod_pic = vodPic
                            videoDet.vod_name = vodName
                            videoDet.vod_remarks = vodDiJiJi.trim()
                            videos.push(videoDet)
                        })
                    })

                    backData = parseClassList(videos, list)
                }
            } catch (e) {
                await this.msgtodc(e)
                $.logErr(e)
                backData.error = e.message
            }

            return $.toStr(backData)
        }

        async getVideoList(queryParams) {
            let page = queryParams.pg
            let type = queryParams.t

            let realTypeName = ''
            if (type === '') return this.getClassList()
            switch (type) {
                case '1':
                    realTypeName = '/new-movie'
                    break
                case '2':
                    realTypeName = '/tv-drama'
                    break
                case '3':
                    realTypeName = '/hot-month'
                    break
                case '4':
                    realTypeName = '/high-movie'
                    break
                case '5':
                    realTypeName = '/cartoon-movie'
                    break
                case '6':
                    realTypeName = '/hongkong-movie'
                    break
                case '7':
                    realTypeName = '/domestic-drama'
                    break
                case '8':
                    realTypeName = '/american-drama'
                    break
                case '9':
                    realTypeName = '/korean-drama'
                    break
                case '10':
                    realTypeName = '/anime-drama'
                    break
            }

            let listUrl = this.removeTrailingSlash(this.url) + realTypeName + '/page/' + page
            let backData = {}
            try {
                let pro = await $.http.get({ url: listUrl, headers: this.headers })
                let proData = pro.body
                if (proData) {
                    let _$ = $.cheerio.load(proData)
                    let allVideo = _$('.bt_img.mi_ne_kd.mrb li')
                    let lastPage = _$('.pagenavi_txt a[title="跳转到最后一页"]').attr('href')
                    if (lastPage) {
                        let parts = lastPage.split('/')
                        lastPage = parts[parts.length - 1]
                    } else {
                        lastPage = '1'
                    }
                    let videos = []
                    allVideo.each((index, element) => {
                        let vodUrl = _$(element).find('a').attr('href') || ''
                        let vodPic = _$(element).find('img.thumb').attr('data-original') || ''
                        let vodName = _$(element).find('img.thumb').attr('alt') || ''
                        let vodDiJiJi = _$(element).find('.jidi span').text() ? _$(element).find('.jidi span').text() : _$(element).find('.hdinfo').text()

                        let videoDet = {}
                        videoDet.vod_id = +vodUrl.match(/movie\/(.+)\.html/)[1]
                        videoDet.vod_pic = vodPic
                        videoDet.vod_name = vodName
                        videoDet.vod_remarks = vodDiJiJi.trim()
                        videos.push(videoDet)
                    })

                    backData = parseVideoList(videos, page, lastPage)
                }
            } catch (e) {
                await this.msgtodc(e)
                $.logErr('Error fetching list:', e)
                backData.error = e.message
            }
            return $.toStr(backData)
        }

        async getVideoDetail(queryParams) {
            let ids = queryParams.ids
            let backData = {}
            try {
                let webUrl = this.url + `/movie/${ids}.html`
                let pro = await $.http.get({ url: webUrl, headers: this.headers })
                let proData = pro.body
                if (proData) {
                    let _$ = $.cheerio.load(proData)
                    let vod_name = _$('.moviedteail_tt h1').text()
                    let vod_content = _$('.yp_context').text()
                    let vod_pic = _$('.dyimg img').attr('src')

                    let juJiDocment = _$('.paly_list_btn').find('a')
                    let vod_play_url = ''
                    juJiDocment.each((index, element) => {
                        vod_play_url += _$(element).text()
                        vod_play_url += '$'
                        vod_play_url += 'https://ykusu.ykusu/subaibai/provide/vod?ac=play&url=' + encodeURIComponent(_$(element).attr('href')) + '&n=.m3u8'
                        vod_play_url += '#'
                    })

                    backData = parseVideoDetail(+ids, vod_name, vod_pic, vod_content.trim(), vod_play_url)
                }
            } catch (e) {
                await this.msgtodc(e)
                $.logErr(e)
                backData.error = e.message
            }

            return $.toStr(backData)
        }

        async getVideoPlayUrl(queryParams) {
            let backData = {}
            let url = decodeURIComponent(queryParams.url)
            try {
                let html = await $.http.get({ url: url, headers: this.headers })

                let proData = html.body
                if (proData) {
                    let _$ = $.cheerio.load(proData)
                    let isVip = _$('.noplay').text()
                    if (isVip) {
                        $.msg('仅对会员开放')
                        return $.toStr({ data: null })
                    }
                    let iframe = _$('iframe').filter((i, iframe) => $(iframe).attr('src').includes('Cloud'))

                    if (0 < iframe.length) {
                        const iframeHtml = (
                            await $.http.get({
                                url: iframe[0].attr('src'),
                                headers: {
                                    Referer: url,
                                    'User-Agent':
                                        'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
                                },
                            })
                        ).body
                        let code = iframeHtml
                                .match(/var url = '(.*?)'/)[1]
                                .split('')
                                .reverse()
                                .join(''),
                            temp = ''
                        for (let i = 0; i < code.length; i += 2) temp += String.fromCharCode(parseInt(code[i] + code[i + 1], 16))
                        const playUrl = temp.substring(0, (temp.length - 7) / 2) + temp.substring((temp.length - 7) / 2 + 7)

                        backData.data = playUrl
                    } else {
                        let playUrl = 'error'
                        const script = _$('script')
                        const js = script.filter((i, el) => _$(el).text().includes('window.wp_nonce')).text() || ''
                        const group = js.match(/(var.*)eval\((\w*\(\w*\))\)/)
                        const md5 = $.CryptoJS
                        const result = eval(group[1] + group[2])
                        playUrl = result.match(/url:.*?['"](.*?)['"]/)[1]

                        backData.data = playUrl
                    }
                }
            } catch (e) {
                await this.msgtodc(e)
                $.logErr(e)
                backData.error = e.message
            }
            return $.toStr(backData)
        }

        async searchVideo(queryParams) {
            const pg = queryParams.pg
            const wd = queryParams.wd
            let backData = {}

            try {
                let searchUrl = this.url + `/page/${pg}?s=${wd}`
                let searchRes = await $.http.get({
                    url: searchUrl,
                    headers: this.headers,
                })
                let _$ = $.cheerio.load(searchRes.body)
                let videos = []
                let allVideo = _$('.search_list').find('li')
                allVideo.each((index, element) => {
                    let vodUrl = _$(element).find('a').attr('href') || ''
                    let vodPic = _$(element).find('img.thumb').attr('data-original') || ''
                    let vodName = _$(element).find('img.thumb').attr('alt') || ''
                    let vodDiJiJi = _$(element).find('.jidi').text() || ''

                    let videoDet = {}
                    videoDet.vod_id = +vodUrl.match(/movie\/(.+)\.html/)[1]
                    videoDet.vod_pic = vodPic
                    videoDet.vod_name = vodName
                    videoDet.vod_remarks = vodDiJiJi.trim()
                    videos.push(videoDet)
                })

                backData = parseVideoList(videos, pg, '1')
            } catch (e) {
                await this.msgtodc(e)
                $.logErr(e)
                backData.error = e.message
            }

            return $.toStr(backData)
        }
    })()
}

function hjkkClass() {
    return new (class extends spider {
        constructor() {
            super()
            this.siteName = '韓劇看看'
            this.url = 'https://www.hanjukankan.com'
            this.headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
            }
            this.ignoreClassName = ['首页', '泰剧', 'APP']
        }

        async getClassList() {
            let webUrl = this.url
            let backData = {}
            try {
                const pro = await $.http.get({ url: webUrl, headers: this.headers })
                let proData = await pro.body

                let _$ = $.cheerio.load(proData)
                let allClass = _$('ul.myui-header__menu a')
                let list = []
                allClass.each((index, element) => {
                    let isIgnore = this.isIgnoreClassName(_$(element).text())
                    if (isIgnore) {
                        return
                    }
                    let type_name = _$(element).text()
                    let url = _$(element).attr('href') || ''

                    if (url.length > 0 && type_name.length > 0) {
                        let videoClass = {}
                        videoClass.type_id = index
                        videoClass.type_name = type_name.trim()
                        list.push(videoClass)
                    }
                })

                let allVideo = _$('.myui-panel')
                let videos = []
                allVideo.each((index, element) => {
                    let nodes = _$(element).find('ul.myui-vodlist li')
                    nodes.each((index, element) => {
                        let vodUrl = _$(element).find('a').attr('href') || ''
                        let vodPic = _$(element).find('a').attr('data-original') || ''
                        let vodName = _$(element).find('a').attr('title') || ''
                        let vodDiJiJi = ''

                        let videoDet = {}
                        videoDet.vod_id = +vodUrl.match(/movie\/index(.+)\.html/)[1]
                        videoDet.vod_pic = vodPic
                        videoDet.vod_name = vodName
                        videoDet.vod_remarks = vodDiJiJi.trim()
                        videos.push(videoDet)
                    })
                })

                backData = parseClassList(videos, list)
            } catch (e) {
                await this.msgtodc(e)
                $.logErr(e)
                backData.error = e.message
            }

            return $.toStr(backData)
        }

        async getVideoList(queryParams) {
            const page = queryParams.pg
            const type = queryParams.t

            if (type === '') return this.getClassList()

            let listUrl = this.removeTrailingSlash(this.url) + '/frim/index' + type + '-' + page + '.html'
            let backData = {}
            try {
                let pro = await $.http.get({ url: listUrl, headers: this.headers })
                let proData = pro.body

                let _$ = $.cheerio.load(proData)
                let allVideo = _$('.myui-vodlist li')
                let lastPage = _$('.myui-page a')
                    .filter((i, el) => _$(el).text() === '尾页')
                    .attr('href')
                if (lastPage) {
                    lastPage = lastPage.match(/index.-(.+)\.html/)[1]
                } else {
                    lastPage = '1'
                }
                let videos = []
                allVideo.each((index, element) => {
                    let vodUrl = _$(element).find('a').attr('href') || ''
                    let vodPic = _$(element).find('a').attr('data-original') || ''
                    let vodName = _$(element).find('a').attr('title') || ''
                    let vodDiJiJi = ''

                    let videoDet = {}
                    videoDet.vod_id = +vodUrl.match(/movie\/index(.+)\.html/)[1]
                    videoDet.vod_pic = vodPic
                    videoDet.vod_name = vodName
                    videoDet.vod_remarks = vodDiJiJi.trim()
                    videos.push(videoDet)
                })

                backData = parseVideoList(videos, page, lastPage)
            } catch (e) {
                await this.msgtodc(e)
                $.logErr('Error fetching list:', e)
                backData.error = e.message
            }
            return $.toStr(backData)
        }

        async getVideoDetail(queryParams) {
            let ids = queryParams.ids
            let backData = {}
            try {
                let webUrl = this.url + `/movie/index${ids}.html`
                let pro = await $.http.get({ url: webUrl, headers: this.headers })
                let proData = pro.body

                let _$ = $.cheerio.load(proData)
                let vod_name = _$('h1.title').text()
                let vod_content = _$('#jq .tab-content.myui-panel_bd').text()
                let vod_pic = _$('.myui-content__thumb img').attr('data-original')

                let juJiDocment = _$('#playlist1 ul li').find('a')
                let vod_play_url = ''
                juJiDocment.each((index, element) => {
                    vod_play_url += _$(element).text()
                    vod_play_url += '$'
                    vod_play_url +=
                        'https://ykusu.ykusu/hjkk/provide/vod?ac=play&url=' + encodeURIComponent(this.combineUrl(_$(element).attr('href'))) + '&n=.m3u8'
                    vod_play_url += '#'
                })

                backData = parseVideoDetail(+ids, vod_name, vod_pic, vod_content.trim(), vod_play_url)
            } catch (e) {
                await this.msgtodc(e)
                $.logErr(e)
                backData.error = e.message
            }

            return $.toStr(backData)
        }

        async getVideoPlayUrl(queryParams) {
            let backData = {}
            let url = decodeURIComponent(queryParams.url)
            try {
                let html = await $.http.get({ url: url, headers: this.headers })
                let proData = html.body

                let _$ = $.cheerio.load(proData)
                let script = _$('.myui-player__box script').text()
                let playUrl = eval(script.match(/now=(.*);var pn/)[1])
                if (/\/file\//.test(playUrl)) {
                    playUrl = playUrl.replace('/file', '')
                }

                backData.data = playUrl
            } catch (e) {
                await this.msgtodc(e)
                $.logErr(e)
                backData.error = e.message
            }
            return $.toStr(backData)
        }

        async searchVideo(queryParams) {
            const pg = queryParams.pg
            const wd = queryParams.wd
            let backData = {}

            try {
                let searchUrl = this.url + `/search.php?searchword=${wd}`
                let searchRes = await $.http.get({
                    url: searchUrl,
                    headers: this.headers,
                })
                let _$ = $.cheerio.load(searchRes.body)
                let videos = []
                let allVideo = _$('#searchList').find('li')
                allVideo.each((index, element) => {
                    let vodUrl = _$(element).find('a.myui-vodlist__thumb').attr('href') || ''
                    let vodPic = _$(element).find('a.myui-vodlist__thumb').attr('data-original') || ''
                    let vodName = _$(element).find('a.myui-vodlist__thumb').attr('title') || ''
                    let vodDiJiJi = _$(element).find('span.pic-tag').text() || ''

                    let videoDet = {}
                    videoDet.vod_id = +vodUrl.match(/movie\/index(.+)\.html/)[1]
                    videoDet.vod_pic = vodPic
                    videoDet.vod_name = vodName
                    videoDet.vod_remarks = vodDiJiJi.trim()
                    videos.push(videoDet)
                })

                backData = parseVideoList(videos, pg, '1')
            } catch (e) {
                await this.msgtodc(e)
                $.logErr(e)
                backData.error = e.message
            }

            return $.toStr(backData)
        }
    })()
}

function nkvodClass() {
    return new (class extends spider {
        constructor() {
            super()
            this.siteName = '耐看'
            this.url = 'https://nkvod.com'
            // this.url = 'https://www.nkdyw.us'
            this.headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                Referer: this.url,
            }
            this.ignoreClassName = ['热搜榜', 'APP', '首页']
        }

        async initParseMap() {
            const date = new Date()
            const t = '' + date.getFullYear() + (date.getMonth() + 1) + date.getDate()
            const url = this.url + '/static/js/playerconfig.js?t=' + t

            try {
                const res = await $.http.get({ url: url, headers: this.headers })
                let isGuard = await this.checkGuard(url)
                if (isGuard) {
                    let cookie = await this.getCookie(url, isGuard['set-cookie'] || isGuard['Set-Cookie'])
                    $.log('cookie = ' + cookie)
                }
                const js = res.body
                const jsEval = js + '\nMacPlayerConfig'
                const playerList = eval(jsEval).player_list
                const players = Object.values(playerList)
                let parseMap = {}
                players.forEach((item) => {
                    if (!item.ps || item.ps === '0') return
                    if (!item.parse) return
                    parseMap[item.show] = item.parse
                })
                $.setdata($.toStr(parseMap), 'xptv-sources-nkvod-parseMap')
            } catch (e) {
                await this.msgtodc(e)
                $.logErr(e)
            }
        }

        async getClassList() {
            await this.initParseMap()
            let backData = {}
            try {
                let list = [
                    { type_id: 1, type_name: '電影' },
                    { type_id: 2, type_name: '電視劇' },
                    { type_id: 3, type_name: '綜藝' },
                    { type_id: 4, type_name: '動漫' },
                    { type_id: 13, type_name: '國產劇' },
                    { type_id: 14, type_name: '港台劇' },
                    { type_id: 15, type_name: '日韓劇' },
                    { type_id: 16, type_name: '歐美劇' },
                    { type_id: 20, type_name: '其他劇' },
                ]

                backData = parseClassList([], list)
            } catch (e) {
                await this.msgtodc(e)
                $.logErr(e)
                backData.error = e.message
            }

            return $.toStr(backData)
        }

        async getVideoList(queryParams) {
            let page = queryParams.pg
            let type = queryParams.t

            // if (type === '') return this.getClassList()

            let listUrl = this.removeTrailingSlash(this.url) + `/index.php/ajax/data?mid=1&tid=${type}&page=${page}&limit=20`
            let backData = {}
            try {
                let pro = await $.http.get({ url: listUrl, headers: this.headers })
                let proData = pro.body
                // $.msg(proData)
                backData = $.toObj(proData)
            } catch (e) {
                await this.msgtodc(e)
                $.logErr('Error fetching list:', e)
                backData.error = e.message
            }
            return $.toStr(backData)
        }

        async getVideoDetail(queryParams) {
            let ids = queryParams.ids
            let backData = {}
            try {
                let webUrl = this.url + `/detail/${ids}.html`
                let pro = await $.http.get({ url: webUrl, headers: this.headers })
                let proData = pro.body

                let _$ = $.cheerio.load(proData)
                let vod_name = _$('.detail-info h3').text()
                let vod_content = _$('.switch-box .text').text()
                let vod_pic = _$('.detail-pic img').attr('data-src')

                let from = []
                _$('.anthology .swiper-wrapper a').each((index, element) => {
                    let name = _$(element)
                        .contents()
                        .filter(function () {
                            return this.type === 'text'
                        })
                        .text()
                        .trim()
                    from.push(name)
                })

                let juJiDocment = _$('.anthology-list-box')
                let vod_play_url = ''
                juJiDocment.each((index, element) => {
                    let line = from[index]
                    let allvideos = _$(element).find('ul.anthology-list-play li a')
                    allvideos.each((index, element) => {
                        let playerUrl = this.combineUrl(_$(element).attr('href'))
                        vod_play_url += line + '-' + _$(element).text()
                        vod_play_url += '$'
                        vod_play_url +=
                            'https://ykusu.ykusu/nkvod/api.php/provide/vod?ac=play&url=' + `${from[index]}@@@` + encodeURIComponent(playerUrl) + '&n=.m3u8'
                        vod_play_url += '#'
                    })
                    vod_play_url += '$$$'
                })

                backData = parseVideoDetail(+ids, vod_name, vod_pic, vod_content.trim(), vod_play_url)
                backData.list[0].vod_play_from = from.join('$$$')
                backData.list[0].vod_play_note = '$$$'
            } catch (e) {
                await this.msgtodc(e)
                backData.error = e.message
            }

            return $.toStr(backData)
        }

        async getVideoPlayUrl(queryParams) {
            let backData = {}
            let parseMap = $.toObj($.getdata('xptv-sources-nkvod-parseMap'))
            let parts = decodeURIComponent(queryParams.url).split('@@@')
            let from = parts[0]
            let url = parts[1]
            try {
                let html = await $.http.get({ url: url, headers: this.headers })
                let proData = html.body

                let _$ = $.cheerio.load(proData)
                const js = $.toObj(_$('script:contains(player_aaaa)').html().replace('var player_aaaa=', ''))
                let playUrl = js.url
                if (js.encrypt == 1) {
                    playUrl = unescape(playUrl)
                } else if (js.encrypt == 2) {
                    playUrl = unescape(base64Decode(playUrl))
                }
                if (/\.m3u8$/.test(playUrl)) {
                    backData.data = playUrl
                } else {
                    const parseUrl = parseMap[from]
                    if (parseUrl) {
                        const reqUrl = parseUrl + playUrl
                        const parseHtml = (
                            await $.http.get({
                                url: reqUrl,
                                headers: this.headers,
                            })
                        ).body
                        const matches = parseHtml.match(/let ConFig = {([\w\W]*)},box/)
                        if (matches && matches.length > 1) {
                            const configJson = '{' + matches[1].trim() + '}'
                            const config = $.toObj(configJson)
                            playUrl = this.decryptUrl(config)
                        }
                    }
                    backData.data = playUrl
                }
            } catch (e) {
                await this.msgtodc(e)
                backData.error = e.message
            }
            return $.toStr(backData)
        }

        async searchVideo(queryParams) {
            const pg = queryParams.pg
            const wd = queryParams.wd
            let backData = {}

            try {
                let searchUrl = this.url + `/index.php/ajax/suggest?mid=1&wd=${wd}&limit=10`
                let searchRes = await $.http.get({
                    url: searchUrl,
                    headers: this.headers,
                })

                backData = $.toStr(searchRes.body)
            } catch (e) {
                await this.msgtodc(e)
                backData.error = e.message
            }

            return $.toStr(backData)
        }

        decryptUrl(jsConfig) {
            const key = $.CryptoJS.enc.Utf8.parse('2890' + jsConfig.config.uid + 'tB959C')
            const iv = $.CryptoJS.enc.Utf8.parse('GZ4JgN2BdSqVWJ1z')
            const mode = $.CryptoJS.mode.CBC
            const padding = $.CryptoJS.pad.Pkcs7
            const decrypted = $.CryptoJS.AES.decrypt(jsConfig.url, key, {
                iv: iv,
                mode: mode,
                padding: padding,
            })
            const decryptedUrl = $.CryptoJS.enc.Utf8.stringify(decrypted)
            return decryptedUrl
        }

        async checkGuard(url) {
            let res = await $.http.get({
                url: url,
                headers: this.headers,
            })
            if (res.body.includes('/_guard/html.js')) return res.headers
            return false
        }

        async getCookie(url, cookie) {
            let guard = this.g(cookie)
            let ret = this.setRet(guard)
            let reqCookie = 'guard=' + guard + '; ' + ret
            let headers = {
                'user-agent': this.headers['User-Agent'],
                referer: url,
                cookie: reqCookie,
            }

            // 先等5秒再發送請求獲取guardok，否則伺服器端不認得guardret
            $.log('wait 5s')
            await $.wait(5000)

            let res = await $.http.get({ url: url, headers: headers })
            let guardok = res.headers['set-cookie'] || res.headers['Set-Cookie']
            return guardok
        }

        g(cookie) {
            var _0x15aae7 = '; ' + cookie,
                parts = _0x15aae7.split('; ' + 'guard' + '=')
            if (parts.length == 2) return parts.pop().split(';').shift()
        }

        setRet(_0x34d4ed) {
            var _0x3a9f4b = _0x34d4ed.substr(0, 8)
            var time_num_plain = _0x34d4ed.substr(12)
            var _0x305bd1 = parseInt(time_num_plain.substr(10))
            var _0x552e00 = _0x305bd1 * 2 + 17 - 2
            var encrypted = this.x(_0x552e00.toString(), _0x3a9f4b)

            var guard_encrypted = base64Encode(encrypted)
            return 'guardret=' + guard_encrypted
        }

        x(input, _0x3a0115) {
            let output = ''
            var _0x3a0115 = _0x3a0115 + 'PTNo2n3Ev5'
            for (let _0x4a215b = 0; _0x4a215b < input.length; _0x4a215b++) {
                const charCode = input.charCodeAt(_0x4a215b) ^ _0x3a0115.charCodeAt(_0x4a215b % _0x3a0115.length)
                output += String.fromCharCode(charCode)
            }
            return output
        }
    })()
}

function anfunsClass() {
    return new (class extends spider {
        constructor() {
            super()
            this.siteName = 'anfuns'
            this.url = 'https://www.anfuns.org'
            this.headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                Referer: this.url,
            }
            this.ignoreClassName = ['首页', '爱发电', 'QQ', '动漫资讯', '专题', '留言', '最新', '排行']
        }

        async getClassList() {
            let webUrl = this.url
            let backData = {}
            try {
                const pro = await $.http.get({ url: webUrl, headers: this.headers })
                let proData = await pro.body

                let _$ = $.cheerio.load(proData)
                let allClass = _$('.hl-menus li a')
                let list = []
                allClass.each((index, element) => {
                    let isIgnore = this.isIgnoreClassName(_$(element).find('span').text())
                    if (isIgnore) {
                        return
                    }
                    let type_name = _$(element).find('span').text()
                    let url = _$(element).attr('href') || ''

                    if (url.length > 0 && type_name.length > 0) {
                        let videoClass = {}
                        videoClass.type_id = parseInt(url.match(/type\/(\d+)\.html/)[1])
                        videoClass.type_name = type_name.trim()
                        list.push(videoClass)
                    }
                })

                let allVideo = _$('.hl-row-box')
                let videos = []
                allVideo.each((index, element) => {
                    let nodes = _$(element).find('li.hl-list-item')
                    nodes.each((index, element) => {
                        let vodUrl = _$(element).find('a.hl-item-thumb').attr('href') || ''
                        let vodPic = _$(element).find('a.hl-item-thumb').attr('data-original') || ''
                        let vodName = _$(element).find('a.hl-item-thumb').attr('title') || ''
                        let vodDiJiJi = _$(element).find('span.remarks').text() || ''

                        if (!vodUrl.includes('/anime/')) return
                        if (!vodPic.includes('http')) vodPic = this.url + vodPic

                        let videoDet = {}
                        videoDet.vod_id = +vodUrl.match(/anime\/(.+)\.html/)[1]
                        videoDet.vod_pic = vodPic
                        videoDet.vod_name = vodName
                        videoDet.vod_remarks = vodDiJiJi.trim()
                        videos.push(videoDet)
                    })
                })

                backData = parseClassList(videos, list)
            } catch (e) {
                await this.msgtodc(e)
                $.logErr(e)
                backData.error = e.message
            }

            return $.toStr(backData)
        }

        async getVideoList(queryParams) {
            const page = queryParams.pg
            const type = queryParams.t

            if (type === '') return this.getClassList()

            let listUrl = `${this.url}/type/${type}-${page}.html`
            let backData = {}
            try {
                let pro = await $.http.get({ url: listUrl, headers: this.headers })
                let proData = pro.body

                let _$ = $.cheerio.load(proData)
                let allVideo = _$('.hl-list-item')
                let lastPage = _$('.hl-page-wrap li.hl-hidden-xs').eq(4).find('a').attr('href')
                if (lastPage) {
                    let regex = new RegExp(`/type\/${type}-(.*)\.html`)
                    lastPage = lastPage.match(regex)[1]
                } else {
                    lastPage = '1'
                }
                let videos = []
                allVideo.each((index, element) => {
                    let vodUrl = _$(element).find('a.hl-item-thumb').attr('href') || ''
                    let vodPic = _$(element).find('a.hl-item-thumb').attr('data-original') || ''
                    let vodName = _$(element).find('a.hl-item-thumb').attr('title') || ''
                    let vodDiJiJi = _$(element).find('span.remarks').text() || ''

                    if (!vodPic.includes('http')) vodPic = this.url + vodPic

                    let videoDet = {}
                    videoDet.vod_id = +vodUrl.match(/anime\/(.+)\.html/)[1]
                    videoDet.vod_pic = vodPic
                    videoDet.vod_name = vodName.trim()
                    videoDet.vod_remarks = vodDiJiJi.trim()
                    videos.push(videoDet)
                })

                backData = parseVideoList(videos, page, lastPage)
            } catch (e) {
                await this.msgtodc(e)
                $.logErr('Error fetching list:', e)
                backData.error = e.message
            }
            return $.toStr(backData)
        }

        async getVideoDetail(queryParams) {
            let ids = queryParams.ids
            let backData = {}
            try {
                let webUrl = this.url + `/anime/${ids}.html`
                let pro = await $.http.get({ url: webUrl, headers: this.headers })
                let proData = pro.body

                let _$ = $.cheerio.load(proData)
                let vod_name = _$('h2.hl-dc-title').text()
                let vod_content = _$('.hl-content-text').text()
                let vod_pic = _$('.hl-item-thumb').attr('data-original')

                let from = []
                _$('.hl-plays-from a').each((i, e) => {
                    let name = _$(e).text().trim()
                    from.push(name)
                })

                let juJiDocment = _$('ul.hl-plays-list')
                let playlist = []
                juJiDocment.each((index, element) => {
                    let videos = _$(element).find('li a')
                    let vod_play_url = ''
                    videos.each((i, e) => {
                        vod_play_url += from[index] + '-' + _$(e).text()
                        vod_play_url += '$'
                        vod_play_url +=
                            'https://ykusu.ykusu/anfuns/provide/vod?ac=play&url=' + encodeURIComponent(this.combineUrl(_$(e).attr('href'))) + '&n=.m3u8'
                        vod_play_url += '#'
                    })
                    playlist.push(vod_play_url)
                })

                backData = parseVideoDetail(+ids, vod_name, vod_pic, vod_content.trim(), playlist.join('$$$'))
                backData.list[0].vod_play_from = from.join('$$$')
                backData.list[0].vod_play_note = '$$$'
            } catch (e) {
                await this.msgtodc(e)
                $.logErr(e)
                backData.error = e.message
            }

            return $.toStr(backData)
        }

        async getVideoPlayUrl(queryParams) {
            let backData = {}
            let url = decodeURIComponent(queryParams.url)
            try {
                let html = await $.http.get({ url: url, headers: this.headers })
                let proData = html.body

                const _$ = $.cheerio.load(proData)
                let config = $.toObj(_$('script:contains(player_)').html().replace('var player_aaaa=', ''))
                let art = this.url + '/vapi/AIRA/art.php?url=' + config.url
                let artres = await $.http.get({
                    url: art,
                    headers: {
                        'User-Agent': this.headers['User-Agent'],
                        Referer: url,
                    },
                })
                if (artres.body) {
                    const _$ = $.cheerio.load(artres.body)
                    let playUrl = _$('script:contains(var Config)')
                        .html()
                        .match(/url: '(.*)'/)[1]
                    backData.data = playUrl
                }
                // let playUrl = getVideoUrl(config.url)
                // backData.data = playUrl

                // function getVideoUrl(_0xdfbc96) {
                //     const pKey = $.CryptoJS.enc.Utf8.parse(base64Decode('QW5GdW5zVmFwaTIzMzI5MA=='))
                //     const _0x3e603d = $.CryptoJS.AES.decrypt(_0xdfbc96, pKey, {
                //         mode: $.CryptoJS.mode.ECB,
                //     })
                //     return _0x3e603d.toString($.CryptoJS.enc.Utf8)
                // }
            } catch (e) {
                await this.msgtodc(e)
                $.logErr(e)
                backData.error = e.message
            }
            return $.toStr(backData)
        }

        async searchVideo(queryParams) {
            const pg = queryParams.pg
            const wd = queryParams.wd
            let backData = {}

            try {
                let searchUrl = this.url + `/search/page/${pg}/wd/${wd}.html`
                let searchRes = await $.http.get({
                    url: searchUrl,
                    headers: this.headers,
                })
                let _$ = $.cheerio.load(searchRes.body)
                let videos = []
                let allVideo = _$('li.hl-list-item')
                allVideo.each((index, element) => {
                    let vodUrl = _$(element).find('a.hl-item-thumb').attr('href') || ''
                    let vodPic = _$(element).find('a.hl-item-thumb').attr('data-original') || ''
                    let vodName = _$(element).find('a.hl-item-thumb').attr('title') || ''
                    let vodDiJiJi = _$(element).find('span.remarks').text() || ''

                    let videoDet = {}
                    videoDet.vod_id = +vodUrl.match(/anime\/(.+)\.html/)[1]
                    videoDet.vod_pic = vodPic
                    videoDet.vod_name = vodName.trim()
                    videoDet.vod_remarks = vodDiJiJi.trim()
                    videos.push(videoDet)
                })

                backData = parseVideoList(videos, pg, '1')
            } catch (e) {
                await this.msgtodc(e)
                $.logErr(e)
                backData.error = e.message
            }

            return $.toStr(backData)
        }
    })()
}

function zeqahtClass() {
    // cnnyy.com
    return new (class extends spider {
        constructor() {
            super()
            this.siteName = '文才'
            this.url = 'https://api.zeqaht.com'
            this.headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            }
        }

        async getClassList(page) {
            let pg = page ? page : 1
            let webUrl = this.url + '/api.php/provide/vod/?ac=detail&t=' + `&pg=${pg}`
            let backData = {}
            try {
                const pro = await $.http.get({ url: webUrl, headers: this.headers })

                let proData = pro.body
                let obj = $.toObj(proData)
                let categories = [
                    { type_id: 1, type_name: '电影' },
                    { type_id: 22, type_name: '喜剧' },
                    { type_id: 23, type_name: '动作' },
                    { type_id: 30, type_name: '科幻' },
                    { type_id: 26, type_name: '爱情' },
                    { type_id: 27, type_name: '悬疑' },
                    { type_id: 87, type_name: '奇幻' },
                    { type_id: 37, type_name: '剧情' },
                    { type_id: 36, type_name: '恐怖' },
                    { type_id: 35, type_name: '犯罪' },
                    { type_id: 33, type_name: '动画' },
                    { type_id: 34, type_name: '惊悚' },
                    { type_id: 25, type_name: '战争' },
                    { type_id: 31, type_name: '冒险' },
                    { type_id: 81, type_name: '灾难' },
                    { type_id: 83, type_name: '伦理' },
                    { type_id: 43, type_name: '其他' },
                    { type_id: 2, type_name: '电视剧' },
                    { type_id: 14, type_name: '国产剧' },
                    { type_id: 15, type_name: '欧美剧' },
                    { type_id: 16, type_name: '港台剧' },
                    { type_id: 62, type_name: '日韩剧' },
                    { type_id: 68, type_name: '其他剧' },
                    // { type_id: 88, type_name: '短剧' },
                    { type_id: 3, type_name: '综艺' },
                    { type_id: 69, type_name: '国产综艺' },
                    { type_id: 70, type_name: '港台综艺' },
                    { type_id: 72, type_name: '日韩综艺' },
                    { type_id: 73, type_name: '欧美综艺' },
                    { type_id: 74, type_name: '其他综艺' },
                    { type_id: 4, type_name: '动漫' },
                    { type_id: 75, type_name: '国产动漫' },
                    { type_id: 76, type_name: '日韩动漫' },
                    { type_id: 77, type_name: '欧美动漫' },
                ]

                obj.class = categories
                backData = obj
            } catch (e) {
                await this.msgtodc(e)
                $.logErr(e)
                backData.error = e.message
            }

            return $.toStr(backData)
        }

        async getVideoList(queryParams) {
            const page = queryParams.pg
            const type = queryParams.t

            if (type === '') return this.getClassList(page)

            let listUrl = `${this.url}/index.php/ajax/data?mid=1&tid=${type}&page=${page}&limit=20`
            let backData = {}
            try {
                let pro = await $.http.get({ url: listUrl, headers: this.headers })
                let proData = pro.body

                let obj = $.toObj(proData)
                obj.list.forEach((e) => {
                    if (!e.vod_pic.includes('http')) e.vod_pic = 'https://obs.gduamoe.com' + e.vod_pic
                })
                backData = obj
            } catch (e) {
                await this.msgtodc(e)
                $.logErr('Error fetching list:', e)
                backData.error = e.message
            }
            return $.toStr(backData)
        }

        async getVideoDetail(queryParams) {
            let ids = queryParams.ids
            let backData = {}
            try {
                let webUrl = this.url + `/api.php/provide/vod?ac=detail&ids=${ids}`
                let pro = await $.http.get({ url: webUrl, headers: this.headers })
                let proData = pro.body

                let obj = $.toObj(proData)
                let play_url = obj.list[0].vod_play_url
                let playlist = play_url.split('#')
                let newPlaylist = []
                playlist.forEach((e, i) => {
                    let parts = e.split('$')
                    let name = parts[0]
                    let url = `https://ykusu.ykusu/zeqaht/provide/vod?ac=play&id=${obj.list[0].vod_id}&index=${i}&n=.m3u8`
                    newPlaylist.push(name + '$' + url)
                })
                obj.list[0].vod_play_url = newPlaylist.join('#')
                backData = obj
            } catch (e) {
                await this.msgtodc(e)
                $.logErr(e)
                backData.error = e.message
            }

            return $.toStr(backData)
        }

        async getVideoPlayUrl(queryParams) {
            let backData = {}
            let id = queryParams.id
            let index = queryParams.index
            let detailPage = base64Decode('aHR0cHM6Ly93d3cuZ2h3OXp3cDUuY29tL2RldGFpbC8=') + id
            try {
                let dres = await $.http.get({ url: detailPage, headers: this.headers })
                let _$ = $.cheerio.load(dres.body)
                let item = _$('div[class^="detail__PlayListBox"]').find('div.listitem').eq(index)
                let nid = item
                    .find('a')
                    .attr('href')
                    .match(/\/sid\/(.+)/)[1]
                let url = `${base64Decode('aHR0cHM6Ly93d3cuZ2h3OXp3cDUuY29tL2FwaS9tdy1tb3ZpZS9hbm9ueW1vdXMvdjEvdmlkZW8vZXBpc29kZS91cmw=')}?id=${id}&nid=${nid}`
                let signKey = base64Decode('Y2I4MDg1MjliYWU2YjZiZTQ1ZWNmYWIyOWE0ODg5YmM=')
                let dataStr = url.split('?')[1]
                let t = Date.now()
                let signStr = dataStr + `&key=${signKey}` + `&t=${t}`

                let pro = await $.http.get({
                    url: url,
                    headers: {
                        'User-Agent': this.headers['User-Agent'],
                        deviceId: this.getUUID(),
                        t: t,
                        sign: $.CryptoJS.SHA1($.CryptoJS.MD5(signStr).toString()).toString(),
                    },
                })
                let proData = pro.body
                let obj = $.toObj(proData)
                let playUrl = obj.data.playUrl
                backData.data = playUrl
            } catch (e) {
                await this.msgtodc(e)
                $.logErr(e)
                backData.error = e.message
            }
            return $.toStr(backData)
        }

        async searchVideo(queryParams) {
            const pg = queryParams.pg
            const wd = queryParams.wd
            let backData = {}

            try {
                let searchUrl = this.url + `/api.php/provide/vod?ac=detail&wd=${wd}&pg=${pg}`
                let searchRes = await $.http.get({
                    url: searchUrl,
                    headers: this.headers,
                })
                backData = $.toObj(searchRes.body)
            } catch (e) {
                await this.msgtodc(e)
                $.logErr(e)
                backData.error = e.message
            }

            return $.toStr(backData)
        }

        getUUID() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (e) => ('x' === e ? (16 * Math.random()) | 0 : 'r&0x3' | '0x8').toString(16))
        }
    })()
}

function mgtimiClass() {
    // from ios151
    return new (class extends spider {
        constructor() {
            super()
            this.siteName = 'mg'
            this.headers = {
                'User-Agent': 'MGTV-iPhone-appstore/8.0.2 (iPhone; iOS 17.1; Scale/3.00)',
            }
        }

        async getVideoPlayUrl(queryParams) {
            let backData = {}
            let url = decodeURIComponent(queryParams.url)
            let id = url.match(/b\/(.*)\/(.*)\.html/)[2]
            let getSource =
                base64Decode(
                    'aHR0cHM6Ly9tb2JpbGUtc3RyZWFtLmFwaS5tZ3R2LmNvbS92MS92aWRlby9zb3VyY2U/bW9kPWlQaG9uZTEzJTJDMiZvc1R5cGU9aW9zJm9zVmVyc2lvbj0xNy4xJnRpY2tldD00RjAzNDJDNzQ0ODkzQkM1QkUyRUU3QkVGRkIwREFGRCZ2aWRlb0lkPQ=='
                ) + id

            try {
                let html = await $.http.get({ url: getSource, headers: this.headers })
                let proData = html.body

                let obj = $.toObj(proData)
                if (obj.code == 10023) {
                    $.msg(obj.msg)
                    backData.data = null
                } else {
                    let videoSource = obj.data.videoSources[0]
                    let videoUrl = videoSource.url
                    let vres = await $.http.get({ url: videoUrl, headers: this.headers })
                    if (vres.body) {
                        let playUrl = $.toObj(vres.body).info
                        backData.data = playUrl
                    }
                }
            } catch (e) {
                await this.msgtodc(e)
                $.logErr(e)
                backData.error = e.message
            }
            return $.toStr(backData)
        }
    })()
}

function nonoClass() {
    return new (class extends spider {
        constructor() {
            super()
            this.siteName = 'NO視頻'
            this.url = 'https://www.novipnoad.net'
            this.headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            }
            this.ignoreClassName = ['首页', '剧集']
        }

        async getClassList() {
            let webUrl = this.url
            let backData = {}
            try {
                const pro = await $.http.get({ url: webUrl, headers: this.headers })

                let proData = await pro.body

                let _$ = $.cheerio.load(proData)
                let allClass = _$('.main-menu .nav-ul-menu a')
                let list = []
                allClass.each((index, element) => {
                    let isIgnore = this.isIgnoreClassName(_$(element).text())
                    if (isIgnore) {
                        return
                    }
                    let type_name = _$(element).text()
                    let url = _$(element).attr('href') || ''

                    if (url.length > 0 && type_name.length > 0) {
                        let videoClass = {}
                        videoClass.type_id = index
                        videoClass.type_name = type_name.trim()
                        list.push(videoClass)
                    }
                })

                let allVideo = _$('.smart-box')
                let videos = []
                allVideo.each((index, element) => {
                    let nodes = _$(element).find('.video-item')
                    nodes.each((index, element) => {
                        let vodUrl = _$(element).find('a').attr('href') || ''
                        let vodPic = _$(element).find('a img').attr('data-original') || ''
                        let vodName = _$(element).find('a').attr('title') || ''
                        let vodDiJiJi = _$(element).find('span.remarks').text() || ''

                        let videoDet = {}
                        videoDet.vod_id = +vodUrl.match(/net\/.+\/(.+)\.html/)[1]
                        videoDet.vod_pic = vodPic
                        videoDet.vod_name = vodName.replace(/^(【.*?】)/g, '')
                        videoDet.vod_remarks = vodDiJiJi.trim()
                        videos.push(videoDet)
                    })
                })

                backData = parseClassList(videos, list)
            } catch (e) {
                await this.msgtodc(e)
                $.logErr(e)
                backData.error = e.message
            }

            return $.toStr(backData)
        }

        async getVideoList(queryParams) {
            const page = queryParams.pg
            const type = queryParams.t

            let realTypeName = ''
            if (type === '') return this.getClassList()
            switch (type) {
                case '2':
                    realTypeName = '/tv/hongkong'
                    break
                case '3':
                    realTypeName = '/tv/taiwan'
                    break
                case '4':
                    realTypeName = '/tv/western'
                    break
                case '5':
                    realTypeName = '/tv/japan'
                    break
                case '6':
                    realTypeName = '/tv/korea'
                    break
                case '7':
                    realTypeName = '/tv/thailand'
                    break
                case '8':
                    realTypeName = '/tv/turkey'
                    break
                case '9':
                    realTypeName = '/movie'
                    break
                case '10':
                    realTypeName = '/anime'
                    break
                case '11':
                    realTypeName = '/shows'
                    break
                case '12':
                    realTypeName = '/music'
                    break
                case '13':
                    realTypeName = '/short'
                    break
                case '14':
                    realTypeName = '/other'
                    break
            }

            let listUrl = `${this.url}${realTypeName}/page/${page}`
            let backData = {}
            try {
                let pro = await $.http.get({ url: listUrl, headers: this.headers })
                let proData = pro.body

                let _$ = $.cheerio.load(proData)
                let allVideo = _$('.video-listing-content .video-item')
                let lastPage = _$('.wp-pagenavi a.last').text() || '1'
                let videos = []
                allVideo.each((index, element) => {
                    let vodUrl = _$(element).find('h3 a').attr('rel') || ''
                    let vodPic = _$(element).find('img').attr('data-original') || ''
                    let vodName = _$(element).find('h3 a').attr('title') || ''
                    let vodDiJiJi = _$(element).find('span.remarks').text() || ''

                    let videoDet = {}
                    videoDet.vod_id = +vodUrl
                    videoDet.vod_pic = vodPic
                    videoDet.vod_name = vodName.replace(/^(【.*?】)/g, '').trim()
                    videoDet.vod_remarks = vodDiJiJi.trim()
                    videos.push(videoDet)
                })

                backData = parseVideoList(videos, page, lastPage)
            } catch (e) {
                await this.msgtodc(e)
                $.logErr('Error fetching list:', e)
                backData.error = e.message
            }
            return $.toStr(backData)
        }

        async getVideoDetail(queryParams) {
            let ids = queryParams.ids
            let backData = {}
            try {
                let webUrl = this.url + `/movie/${ids}.html`
                let pro = await $.http.get({ url: webUrl, headers: this.headers })
                let proData = pro.body

                let _$ = $.cheerio.load(proData)
                let vod_name = _$('.video-item h1').text()
                let vod_content = _$('.item-content p').eq(0).text() || ''
                vod_content = vod_content.includes(';') ? vod_content.split(';')[1] : vod_content
                let vod_pic = _$('.hl-item-thumb').attr('data-original') || ''

                let vod_play_url = ''
                let playInfo = _$('.item-content script').text()
                let pkey = playInfo.match(/pkey:"(.*)"/)[1]
                let ref = _$('meta[property="og:url"]')
                    .attr('content')
                    .match(/\.net(.*)/)[1]

                if (playInfo.includes('vid:')) {
                    let vid = playInfo.match(/vid:"(.*)",/)[1]
                    vod_play_url =
                        '1$' + 'https://ykusu.ykusu/nono/provide/vod?ac=play&vid=' + vid + '&pkey=' + pkey + '&ref=' + encodeURIComponent(ref) + '&n=.m3u8'
                } else {
                    let btns = _$('.multilink-btn')
                    let playlist = []
                    btns.each((index, element) => {
                        let name = _$(element).text()
                        let vid = _$(element).attr('data-vid')
                        let url =
                            name + '$https://ykusu.ykusu/nono/provide/vod?ac=play&vid=' + vid + '&pkey=' + pkey + '&ref=' + encodeURIComponent(ref) + '&n=.m3u8'
                        playlist.push(url)
                    })
                    vod_play_url = playlist.join('$$$')
                }

                backData = parseVideoDetail(+ids, vod_name, vod_pic, vod_content, vod_play_url)
            } catch (e) {
                await this.msgtodc(e)
                $.logErr(e)
                backData.error = e.message
            }

            return $.toStr(backData)
        }

        async getVideoPlayUrl(queryParams) {
            let backData = {}
            let vid = queryParams.vid
            let pkey = queryParams.pkey
            let ref = decodeURIComponent(queryParams.ref)
            try {
                // get vkey
                const playerUrl = `https://player.novipnoad.net/v1/?url=${vid}&pkey=${pkey}&ref=${ref}`
                const player = await $.http.get({
                    url: playerUrl,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
                        referer: 'https://www.novipnoad.net',
                    },
                })
                const data = player.body.match(/decodeURIComponent\(escape\(r\)\)\}(.*)\)/)[1].replace(/["\(\)]/g, '')
                const device = player.body.match(/params\['device'\] = '(\w+)';/)[1]
                const config = data.split(',')
                const vkey = $.toObj(
                    this.getVkey(...config)
                        .match(/JSON.stringify\((.*)\)\);/)[1]
                        .replace(/'/g, '"')
                        .replace(/(ckey|ref|ip|time):/g, '"$1":')
                )

                // get jsapi
                const phpUrl = `https://player.novipnoad.net/v1/player.php?id=${vid}&device=${device}`
                const phpres = await $.http.get({
                    url: phpUrl,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
                        referer: playerUrl,
                    },
                })
                let jsapi = phpres.body.match(/jsapi = '(.*)';/)[1]
                jsapi = jsapi + '?ckey=' + vkey.ckey.toUpperCase() + '&ref=' + encodeURIComponent(vkey.ref) + '&ip=' + vkey.ip + '&time=' + vkey.time

                // get play url
                const jsres = await $.http.get({
                    url: jsapi,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
                        referer: 'https://www.novipnoad.net',
                    },
                })
                let playUrl = jsres.body.match(/decrypt\("(.*)"\)/)[1]
                playUrl = this.decryptUrl(playUrl)
                playUrl = playUrl.quality[playUrl.defaultQuality].url
                backData.data = playUrl
            } catch (e) {
                await this.msgtodc(e)
                $.logErr(e)
                backData.error = e.message
            }
            return $.toStr(backData)
        }

        async searchVideo(queryParams) {
            const pg = queryParams.pg
            const wd = queryParams.wd
            let backData = {}

            try {
                let searchUrl = this.url + `/?s=${wd}`
                let searchRes = await $.http.get({
                    url: searchUrl,
                    headers: {
                        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,/;q=0.8',
                        'user-agent':
                            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
                        referer: 'https://www.novipnoad.net',
                    },
                })
                let _$ = $.cheerio.load(searchRes.body)
                let videos = []
                let allVideo = _$('.search-listing-content .video-item')
                allVideo.each((index, element) => {
                    let vodUrl = _$(element).find('.item-thumbnail a').attr('href') || ''
                    let vodPic = _$(element).find('.item-thumbnail img').attr('data-original') || ''
                    let vodName = _$(element).find('.item-thumbnail a').attr('title') || ''
                    let vodDiJiJi = _$(element).find('span.remarks').text() || ''

                    let videoDet = {}
                    videoDet.vod_id = +vodUrl.match(/net\/.+\/(\d+)\.html/)[1]
                    videoDet.vod_pic = vodPic
                    videoDet.vod_name = vodName.replace(/^(【.*?】)/g, '').trim()
                    videoDet.vod_remarks = vodDiJiJi.trim()
                    videos.push(videoDet)
                })

                backData = parseVideoList(videos, pg, '1')
            } catch (e) {
                await this.msgtodc(e)
                $.logErr(e)
                backData.error = e.message
            }

            return $.toStr(backData)
        }

        getVkey(h, u, n, t, e, r) {
            r = ''
            for (var i = 0, len = h.length; i < len; i++) {
                var s = ''
                while (h[i] !== n[e]) {
                    s += h[i]
                    i++
                }
                for (var j = 0; j < n.length; j++) s = s.replace(new RegExp(n[j], 'g'), j)
                r += String.fromCharCode(this._0xe31c(s, e, 10) - t)
            }
            return decodeURIComponent(escape(r))
        }

        _0xe31c(d, e, f) {
            var g = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/'.split('')
            var h = g.slice(0, e)
            var i = g.slice(0, f)
            var j = d
                .split('')
                .reverse()
                .reduce(function (a, b, c) {
                    if (h.indexOf(b) !== -1) return (a += h.indexOf(b) * Math.pow(e, c))
                }, 0)
            var k = ''
            while (j > 0) {
                k = i[j % f] + k
                j = (j - (j % f)) / f
            }
            return k || 0
        }

        decryptUrl(_0x395610) {
            var _0x15159f = '5f3651b7'
            var _0x36346e = this._0x2b01e7(_0x395610, _0x15159f)
            return JSON.parse(_0x36346e)
        }

        _0x2b01e7(_0x12f758, _0xda9b8e) {
            var b = '3.3.1'
            // var _0x3bf069 = atob(_0x12f758)
            var _0x3bf069 = this.atob(_0x12f758)
            for (var _0x19fa71, _0x300ace = [], _0x18815b = 0, _0xe5da02 = '', _0x1d31f3 = 0; 256 > _0x1d31f3; _0x1d31f3++) {
                _0x300ace[_0x1d31f3] = _0x1d31f3
            }
            for (_0x1d31f3 = 0; 256 > _0x1d31f3; _0x1d31f3++) {
                _0x18815b = (_0x18815b + _0x300ace[_0x1d31f3] + _0xda9b8e.charCodeAt(_0x1d31f3 % _0xda9b8e.length)) % 256
                _0x19fa71 = _0x300ace[_0x1d31f3]
                _0x300ace[_0x1d31f3] = _0x300ace[_0x18815b]
                _0x300ace[_0x18815b] = _0x19fa71
            }
            for (b = _0x18815b = _0x1d31f3 = 0; b < _0x3bf069.length; b++) {
                _0x1d31f3 = (_0x1d31f3 + 1) % 256
                _0x18815b = (_0x18815b + _0x300ace[_0x1d31f3]) % 256
                _0x19fa71 = _0x300ace[_0x1d31f3]
                _0x300ace[_0x1d31f3] = _0x300ace[_0x18815b]
                _0x300ace[_0x18815b] = _0x19fa71
                _0xe5da02 += String.fromCharCode(_0x3bf069.charCodeAt(b) ^ _0x300ace[(_0x300ace[_0x1d31f3] + _0x300ace[_0x18815b]) % 256])
            }
            return _0xe5da02
        }

        atob(b64) {
            var chars = {
                ascii: function () {
                    return 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
                },
                indices: function () {
                    if (!this.cache) {
                        this.cache = {}
                        var ascii = chars.ascii()

                        for (var c = 0; c < ascii.length; c++) {
                            var chr = ascii[c]
                            this.cache[chr] = c
                        }
                    }
                    return this.cache
                },
            }
            var indices = chars.indices(),
                pos = b64.indexOf('='),
                padded = pos > -1,
                len = padded ? pos : b64.length,
                i = -1,
                data = ''

            while (i < len) {
                var code = (indices[b64[++i]] << 18) | (indices[b64[++i]] << 12) | (indices[b64[++i]] << 6) | indices[b64[++i]]
                if (code !== 0) {
                    data += String.fromCharCode((code >>> 16) & 255, (code >>> 8) & 255, code & 255)
                }
            }

            if (padded) {
                data = data.slice(0, pos - b64.length)
            }

            return data
        }
    })()
}

// TODO
function zhuiyiClass() {
    return new (class extends spider {
        constructor() {
            super()
            this.siteName = '追憶'
            this.url = 'http://app.alovo.cn:1122'
            this.headers = {
                'User-Agent': 'Dart/2.14',
            }
        }

        async getClassList(page) {
            let backData = {}
            try {
                let categories = [
                    { type_id: 1, type_name: '電影' },
                    { type_id: 7, type_name: '電視劇' },
                    { type_id: 8, type_name: '動漫' },
                    { type_id: 3, type_name: '綜藝' },
                    { type_id: 48, type_name: '短劇' },
                    { type_id: 49, type_name: '直播' },
                ]

                backData = parseClassList([], categories)
            } catch (e) {
                await this.msgtodc(e)
                $.logErr(e)
                backData.error = e.message
            }

            return $.toStr(backData)
        }

        async getVideoList(queryParams) {
            const page = queryParams.pg
            const type = queryParams.t

            if (type === '') return this.getClassList(page)

            let listUrl = `${this.url}/api.php/app/video?&tid=${type}&pg=${page}&limit=20`
            let backData = {}
            try {
                let pro = await $.http.get({ url: listUrl, headers: this.headers })
                let proData = pro.body

                let obj = $.toObj(proData)
                backData = obj
            } catch (e) {
                await this.msgtodc(e)
                $.logErr('Error fetching list:', e)
                backData.error = e.message
            }
            return $.toStr(backData)
        }

        async getVideoDetail(queryParams) {
            let ids = queryParams.ids
            let backData = {}
            try {
                let webUrl = this.url + `/api.php/app/video_detail?&id=${ids}`
                let pro = await $.http.get({ url: webUrl, headers: this.headers })
                let proData = pro.body

                let obj = $.toObj(proData)
                let id = obj.data.vod_id
                let name = obj.data.vod_name
                let pic = obj.data.vod_pic
                let content = obj.data.vod_content

                let from = obj.data.vod_play_from.split('$$$')
                let playlist = obj.data.vod_url_with_player
                let newPlaylist = []
                playlist.forEach((e, i) => {
                    let ep = e.url.split('#')
                    let temp = []
                    let site = e.code
                    ep.forEach((e, i) => {
                        let parts = e.split('$')
                        let name = site + '-' + parts[0].trim()
                        let url = `https://ykusu.ykusu/zhuiyi/provide/vod?ac=play&url=${encodeURIComponent(parts[1])}&n=.m3u8`
                        temp.push(name + '$' + url)
                    })

                    newPlaylist.push(temp.join('#'))
                })
                backData = parseVideoDetail(id, name, pic, content, newPlaylist.join('$$$'))
            } catch (e) {
                await this.msgtodc(e)
                $.logErr(e)
                backData.error = e.message
            }

            return $.toStr(backData)
        }

        async getVideoPlayUrl(queryParams) {
            let backData = {}
            let url = decodeURIComponent(queryParams.url)
            let jx = 'http://115.231.220.36:8801/jx/tvbox/zy2.php?url=' + url
            try {
                if (/\.m3u8/.test(url)) {
                    backData.data = url
                } else {
                    let res = await $.http.get({ url: jx, headers: this.headers })
                    let obj = $.toObj(res.body)
                    if (obj.code !== 200) {
                        $.log(obj.msg)
                        $.msg('XPTV-sources', obj.msg)
                    } else {
                        backData.data = obj.url
                    }
                }
            } catch (e) {
                await this.msgtodc(e)
                $.logErr(e)
                backData.error = e.message
            }
            return $.toStr(backData)
        }

        async searchVideo(queryParams) {
            const pg = queryParams.pg
            const wd = queryParams.wd
            let backData = {}

            try {
                let searchUrl = this.url + `/api.php/provide/vod?ac=detail&wd=${wd}&pg=${pg}`
                let searchRes = await $.http.get({
                    url: searchUrl,
                    headers: this.headers,
                })
                backData = $.toObj(searchRes.body)
            } catch (e) {
                await this.msgtodc(e)
                $.logErr(e)
                backData.error = e.message
            }

            return $.toStr(backData)
        }
    })()
}

function bilfunClass() {
    return new (class extends spider {
        constructor() {
            super()
            this.siteName = 'bilfun'
            this.url = 'https://bilfun.cc'
            this.headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            }
            this.ignoreClassName = ['首页', '预告片', '追剧周表', '今日更新', '热搜榜', '主题切换', '收藏页', 'APP', '地址', '备用线路']
        }

        async getClassList() {
            let webUrl = this.url
            let backData = {}
            try {
                const pro = await $.http.get({ url: webUrl, headers: this.headers })
                let proData = await pro.body

                let _$ = $.cheerio.load(proData)
                let allClass = _$('ul.navbar-items .swiper-slide.navbar-item a')
                let list = []
                allClass.each((index, element) => {
                    let isIgnore = this.isIgnoreClassName(_$(element).text())
                    if (isIgnore) {
                        return
                    }
                    let type_name = _$(element).text()
                    let url = _$(element).attr('href') || ''
                    let match = url.match(/\/bilfun\/(\d+)\.html/)
                    let urlNumber = match && match[1] ? +match[1] : 999

                    if (url.length > 0 && type_name.length > 0) {
                        let videoClass = {}
                        videoClass.type_id = urlNumber
                        videoClass.type_name = type_name.trim()
                        list.push(videoClass)
                    }
                })

                let allVideo = _$('.module-main.tab-list.active')
                let videos = []
                allVideo.each((index, element) => {
                    let nodes = _$(element).find('.module-items > a')
                    nodes.each((index, element) => {
                        let vodUrl = _$(element).attr('href') || ''
                        let vodPic = _$(element).find('.module-item-pic img').attr('data-original') || ''
                        let vodName = _$(element).attr('title') || ''
                        let vodDiJiJi = _$(element).find('.module-item-note').text() || ''

                        let videoDet = {}
                        videoDet.vod_id = +vodUrl.match(/bilfundetail\/(\d+).html/)[1]
                        videoDet.vod_pic = vodPic
                        videoDet.vod_name = vodName.trim()
                        videoDet.vod_remarks = vodDiJiJi.trim()
                        videos.push(videoDet)
                    })
                })

                backData = parseClassList(videos, list)
            } catch (e) {
                await this.msgtodc(e)
                $.logErr(e)
                backData.error = e.message
            }

            return $.toStr(backData)
        }

        async getVideoList(queryParams) {
            const page = queryParams.pg
            const type = queryParams.t

            if (type === '') return this.getClassList()

            let listUrl = `${this.url}/bilfunshow/${type}--------${page}---.html`
            let backData = {}
            try {
                let pro = await $.http.get({ url: listUrl, headers: this.headers })
                let proData = pro.body

                let _$ = $.cheerio.load(proData)
                let allVideo = _$('.main .content .module > a')
                let lastPage =
                    _$('#page')
                        .children()
                        .last()
                        .attr('href')
                        .match(/--------(.*)---\.html/)[1] || '1'
                let videos = []
                allVideo.each((index, element) => {
                    let vodUrl = _$(element).attr('href') || ''
                    let vodPic = _$(element).find('.module-item-pic img').attr('data-original') || ''
                    let vodName = _$(element).attr('title') || ''
                    let vodDiJiJi = _$(element).find('.module-item-note').text() || ''

                    let videoDet = {}
                    videoDet.vod_id = +vodUrl.match(/bilfundetail\/(\d+).html/)[1]
                    videoDet.vod_pic = vodPic
                    videoDet.vod_name = vodName.trim()
                    videoDet.vod_remarks = vodDiJiJi.trim()
                    videos.push(videoDet)
                })

                backData = parseVideoList(videos, page, lastPage)
            } catch (e) {
                await this.msgtodc(e)
                $.logErr('Error fetching list:', e)
                backData.error = e.message
            }
            return $.toStr(backData)
        }

        async getVideoDetail(queryParams) {
            let ids = queryParams.ids
            let backData = {}
            try {
                let webUrl = this.url + `/bilfundetail/${ids}.html`
                let pro = await $.http.get({ url: webUrl, headers: this.headers })
                let proData = pro.body

                let _$ = $.cheerio.load(proData)
                let vod_name = _$('.module-info-heading h1').text().trim()
                let vod_content = _$('.module-info-item .show-desc p').text() || ''
                let vod_pic = _$('.module-item-pic img').attr('data-original') || ''

                let from = []
                let y_playList = _$('#y-playList > div')
                y_playList.each((index, element) => {
                    let name = _$(element).attr('data-dropdown-value')
                    from.push(name)
                })

                let vod_play_url = []
                let playlist = _$('#panel1')
                playlist.each((index, element) => {
                    let line = from[index].replace('线路一', '量子').replace('线路二', '非凡')
                    let temp = []
                    let ep = _$(element).find('a.module-play-list-link')
                    ep.each((index, element) => {
                        let name = _$(element).find('span').text()
                        let url = _$(element).attr('href')
                        url = 'https://ykusu.ykusu/bilfun/api.php/provide/vod?ac=play&url=' + encodeURIComponent(url)
                        temp.push(`${line}-${name}$${url}&n=.m3u8`)
                    })

                    vod_play_url.push(temp.join('#'))
                })
                // 重新排序
                let lz = []
                let ff = []
                let nby = []
                let backup = []
                let sxcz = []
                let xundm = []
                let btjson = []
                let others = []
                vod_play_url.forEach((e) => {
                    if (e.includes('量子')) {
                        lz.push(e)
                    } else if (e.includes('非凡')) {
                        ff.push(e)
                    } else if (e.includes('NBY')) {
                        nby.push(e)
                    } else if (e.includes('SXCZ')) {
                        sxcz.push(e)
                    } else if (e.includes('讯动漫')) {
                        xundm.push(e)
                    } else if (e.includes('备用')) {
                        backup.push(e)
                    } else if (e.includes('BTJSON')) {
                        btjson.push(e)
                    } else {
                        others.push(e)
                    }
                })
                let newArr = sxcz.concat(xundm, nby, btjson, others, lz, ff, backup)

                backData = parseVideoDetail(+ids, vod_name, vod_pic, vod_content, newArr.join('$$$'))
            } catch (e) {
                await this.msgtodc(e)
                $.logErr(e)
                backData.error = e.message
            }

            return $.toStr(backData)
        }

        async getVideoPlayUrl(queryParams) {
            let backData = {}
            let url = decodeURIComponent(queryParams.url)
            try {
                // get source url
                let weburl = this.url + url
                let res = await $.http.get(weburl, { headers: this.headers })
                let player = $.toObj(`{${res.body.match(/r player_aaaa=\{(.*),"nid":/)[1]}}`)
                let sourceUrl = decodeURIComponent(player.url)
                if (/\.m3u8/.test(sourceUrl)) {
                    backData.data = sourceUrl
                } else {
                    // get key
                    let dplayer = 'https://m.centos.chat/dplayer/?url=' + sourceUrl
                    let keyres = await $.http.get(dplayer, { headers: this.headers })
                    let key = keyres.body.match(/key":"(.*)"/)[1]

                    // get playUrl
                    let api = 'https://m.centos.chat/dplayer/api.php'
                    let t = Date.now()
                    let request = {
                        url: api,
                        headers: {
                            'User-Agent': this.headers['User-Agent'],
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                        },
                        body: `url=${sourceUrl}&time=${t}&key=${key}`,
                    }
                    let apires = await $.http.post(request)
                    let playUrl = $.toObj(apires.body).url
                    playUrl = this.decrypt(playUrl)
                    backData.data = playUrl
                }
            } catch (e) {
                await this.msgtodc(e)
                $.logErr(e)
                backData.error = e.message
            }
            return $.toStr(backData)
        }

        async searchVideo(queryParams) {
            const pg = queryParams.pg
            const wd = queryParams.wd
            let backData = {}

            try {
                let searchUrl = this.url + `/bilfunsearch/${wd}----------${pg}---.html`
                let searchRes = await $.http.get({
                    url: searchUrl,
                    headers: this.headers,
                })
                let _$ = $.cheerio.load(searchRes.body)
                let videos = []
                let allVideo = _$('.module-items .module-card-item')
                allVideo.each((index, element) => {
                    let vodUrl = _$(element).find('.module-card-item-poster').attr('href') || ''
                    let vodPic = _$(element).find('.module-item-pic img').attr('data-original') || ''
                    let vodName = _$(element).find('.module-item-pic img').attr('alt') || ''
                    let vodDiJiJi = _$(element).find('.module-item-note').text() || ''

                    let videoDet = {}
                    videoDet.vod_id = +vodUrl.match(/bilfundetail\/(\d+)\.html/)[1]
                    videoDet.vod_pic = vodPic
                    videoDet.vod_name = vodName.trim()
                    videoDet.vod_remarks = vodDiJiJi.trim()
                    videos.push(videoDet)
                })

                backData = parseVideoList(videos, pg, '1')
            } catch (e) {
                await this.msgtodc(e)
                $.logErr(e)
                backData.error = e.message
            }

            return $.toStr(backData)
        }

        decrypt(_0x1f4af4) {
            let _0x4b33e5 = $.CryptoJS.AES.decrypt(_0x1f4af4, $.CryptoJS.enc.Utf8.parse(base64Decode('d2Vpc3VhbnByb2JpbGZ1bg==')), {
                iv: $.CryptoJS.enc.Utf8.parse(base64Decode('YmlsZnVud2Vpc3VhbnBybw==')),
                mode: $.CryptoJS.mode.CBC,
                padding: $.CryptoJS.pad.Pkcs7,
            })
            return _0x4b33e5.toString($.CryptoJS.enc.Utf8)
        }
    })()
}

function sxClass() {
    return new (class extends spider {
        constructor() {
            super()
            this.siteName = 'sx'
            this.url = ''
            this.headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            }
            this.ignoreClassName = []
        }

        async getVideoPlayUrl(queryParams) {
            let backData = {}
            let url = queryParams.url
            try {
                // get playUrl
                let api = 'https://m.centos.chat/dplayer/api.php'
                let t = Date.now()
                let request = {
                    url: api,
                    headers: {
                        'User-Agent': this.headers['User-Agent'],
                        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    },
                    body: `url=${url}&time=${t}`,
                }
                let apires = await $.http.post(request)
                let playUrl = $.toObj(apires.body).url
                playUrl = this.decrypt(playUrl)
                backData.data = playUrl
            } catch (e) {
                await this.msgtodc(e)
                $.logErr(e)
                backData.error = e.message
            }
            return $.toStr(backData)
        }

        decrypt(_0x1f4af4) {
            let _0x4b33e5 = $.CryptoJS.AES.decrypt(_0x1f4af4, $.CryptoJS.enc.Utf8.parse(base64Decode('d2Vpc3VhbnByb2JpbGZ1bg==')), {
                iv: $.CryptoJS.enc.Utf8.parse(base64Decode('YmlsZnVud2Vpc3VhbnBybw==')),
                mode: $.CryptoJS.mode.CBC,
                padding: $.CryptoJS.pad.Pkcs7,
            })
            return _0x4b33e5.toString($.CryptoJS.enc.Utf8)
        }
    })()
}

function xyClass() {
    return new (class extends spider {
        constructor() {
            super()
            this.siteName = '星芽短劇'
            this.url = 'https://app.whjzjx.cn'
            this.headers = {
                'User-Agent': 'okhttp/4.10.0',
                'Accept-Encoding': 'gzip',
                'x-app-id': '7',
                platform: '1',
                manufacturer: 'asus',
                version_name: '3.3.1',
                user_agent:
                    'Mozilla/5.0 (Linux; Android 14; Zenfone 5Z Build/AP2A.240705.005; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/125.0.6422.165 Mobile Safari/537.36',
                dev_token:
                    'Bsg4gWzOoQc9UEvsnDHZWNlpphiWxQ9MIDNUZIqU6k_irRIWCyYEABtuSI5OBkJ9gDNLzcr1wBQSku05JgYmeQN-lmGn94m-On-JSrqecxcFQdU8VkskVkugV4qUF_mW1sHjcYWeXbfdHM5b2VytKSUCRzlJ-Ix4QuRrll15Rmxo*',
                app_version: '3.3.1',
                device_platform: 'android',
                personalized_recommend_status: '1',
                device_type: 'Zenfone+5Z',
                device_brand: 'asus',
                os_version: '14',
                channel: 'default',
                raw_channel: 'default',
                oaid: '',
                msa_oaid: '',
                uuid: 'randomUUID_9e91d3ce-8658-4d6e-9d1b-6f351611163d',
                device_id: '2885ce2d34c9634b287ab022f2f3a6cfb',
                ab_id: '',
                support_h265: '1',
            }
        }

        async getClassList() {
            let backData = {}
            try {
                let classes = [
                    {
                        type_id: 2,
                        type_name: '热播剧',
                    },
                    {
                        type_id: 8,
                        type_name: '会员专享',
                    },
                    {
                        type_id: 7,
                        type_name: '星选好剧',
                    },
                    {
                        type_id: 3,
                        type_name: '新剧',
                    },
                    {
                        type_id: 5,
                        type_name: '阳光剧场',
                    },
                ]
                let videos = []

                backData = parseClassList(videos, classes)
            } catch (e) {
                await this.msgtodc(e)
                $.logErr(e)
                backData.error = e.message
            }

            return $.toStr(backData)
        }

        async getVideoList(queryParams) {
            const page = queryParams.pg
            let type = queryParams.t
            type === '' ? (type = '1') : type

            let listUrl = `${this.url}/cloud/v2/theater/home_page?theater_class_id=${type}&type=1&page_num=${page}&page_size=24`
            if (type === '1') listUrl = listUrl.replace('&page_num=', '&class2_ids=0&page_num=')
            let backData = {}
            try {
                let pro = await $.http.get({ url: listUrl, headers: await this.getHeader() })
                let proData = pro.body

                let obj = $.toObj(proData)
                let allVideo = obj.data.list
                let videos = []
                allVideo.forEach((e) => {
                    let item = e.theater
                    let vodUrl = item.id || ''
                    let vodPic = item.cover_url || ''
                    let vodName = item.title || ''
                    let vodDiJiJi = `${item.total}集全` || ''

                    let videoDet = {}
                    videoDet.vod_id = +vodUrl
                    videoDet.vod_pic = vodPic
                    videoDet.vod_name = vodName.trim()
                    videoDet.vod_remarks = vodDiJiJi.trim()
                    videos.push(videoDet)
                })
                const hasMore = videos.length > 0
                const pgCount = hasMore ? parseInt(page) + 1 : parseInt(page)

                backData = parseVideoList(videos, page, pgCount)
            } catch (e) {
                await this.msgtodc(e)
                $.logErr('Error fetching list:', e)
                backData.error = e.message
            }
            return $.toStr(backData)
        }

        async getVideoDetail(queryParams) {
            let ids = queryParams.ids
            let backData = {}
            try {
                let webUrl = `${this.url}/v2/theater_parent/detail?theater_parent_id=${ids}`
                let pro = await $.http.get({ url: webUrl, headers: await this.getHeader() })
                let proData = pro.body

                let obj = $.toObj(proData)
                let vod_name = obj.data.title
                let vod_content = ''
                let vod_pic = obj.data.cover_url || ''

                let vod_play_url = []
                let playlist = obj.data.theaters
                playlist.forEach((element) => {
                    let name = element.num
                    let url = element.son_video_url
                    url = 'https://ykusu.ykusu/xy/api.php/provide/vod?ac=play&url=' + encodeURIComponent(url) + '&n=.m3u8'

                    vod_play_url.push(`${name}$${url}`)
                })

                backData = parseVideoDetail(+ids, vod_name, vod_pic, vod_content, vod_play_url.join('#'))
            } catch (e) {
                await this.msgtodc(e)
                $.logErr(e)
                backData.error = e.message
            }

            return $.toStr(backData)
        }

        async getVideoPlayUrl(queryParams) {
            let backData = {}
            let url = decodeURIComponent(queryParams.url)
            try {
                backData.data = url
            } catch (e) {
                await this.msgtodc(e)
                $.logErr(e)
                backData.error = e.message
            }
            return $.toStr(backData)
        }

        async searchVideo(queryParams) {
            const pg = queryParams.pg
            const wd = queryParams.wd
            let backData = {}

            try {
                let searchUrl = this.url + '/v3/search'
                let searchRes = await $.http.post({
                    url: searchUrl,
                    headers: await this.getHeader(),
                    body: {
                        text: wd,
                    },
                })
                const data = $.toObj(searchRes.body).data.theater.search_data
                let videos = []
                data.forEach((element) => {
                    let item = element
                    let vodUrl = item.id || ''
                    let vodPic = item.cover_url || ''
                    let vodName = item.title || ''
                    let vodDiJiJi = `更新到${item.total}集` || ''

                    let videoDet = {}
                    videoDet.vod_id = +vodUrl
                    videoDet.vod_pic = vodPic
                    videoDet.vod_name = vodName.trim()
                    videoDet.vod_remarks = vodDiJiJi.trim()
                    videos.push(videoDet)
                })

                backData = parseVideoList(videos, pg, '1')
            } catch (e) {
                await this.msgtodc(e)
                $.logErr(e)
                backData.error = e.message
            }

            return $.toStr(backData)
        }

        async getHeader() {
            let header = this.headers
            let jwt = $.getval('xptv-xingya-jwt')
            if (!jwt) {
                jwt = await this.getJWT()
                $.setval(jwt, 'xptv-xingya-jwt')
            }
            let currentTime = Math.floor(Date.now() / 1000)
            let exp = this.decodeJWT(jwt).payload.exp

            if (currentTime > exp) {
                // token expired
                jwt = await this.getJWT()
                $.setval(jwt, 'xptv-xingya-jwt')
            }
            header['authorization'] = jwt
            return header
        }

        async getJWT() {
            const login = `https://u.shytkjgs.com/user/v1/account/login`
            let headers = this.headers
            headers['Content-Type'] = 'application/x-www-form-urlencoded'
            const body = `device=${headers.device_id}`

            const res = await $.http.post({
                url: login,
                headers: headers,
                body: body,
            })
            const jwt = $.toObj(res.body).data.token
            return jwt
        }

        decodeJWT(token) {
            function base64UrlDecode(str) {
                // Replace URL-safe characters with Base64 characters
                let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
                // Add padding if necessary
                while (base64.length % 4) {
                    base64 += '='
                }
                // Decode Base64 string
                return base64Decode(base64)
            }

            // Split JWT into parts
            const parts = token.split('.')
            if (parts.length !== 3) {
                throw new Error('Invalid JWT token')
            }

            // Decode header and payload
            const header = JSON.parse(base64UrlDecode(parts[0]))
            const payload = JSON.parse(base64UrlDecode(parts[1]))

            return {
                header: header,
                payload: payload,
                signature: parts[2],
            }
        }
    })()
}

function liteAppleClass() {
    return new (class extends spider {
        constructor() {
            super()
            this.siteName = '小蘋果'
            this.url = 'http://item.xpgtv.xyz'
            this.headers = {
                'User-Agent': 'okhttp/3.12.11',
                Referer: 'http://item.xpgtv.xyz/',
            }
        }

        async getClassList(page) {
            let pg = page ? page : 1
            let webUrl = this.url + '/api.php/v2.main/androidhome'
            let backData = {}
            try {
                const pro = await $.http.get({ url: webUrl, headers: this.headers })

                let proData = pro.body
                let obj = $.toObj(proData)
                let allVideo = []
                let type = obj.data.list
                type.forEach((e) => {
                    let videos = e.list
                    videos.forEach((element) => {
                        let id = element.id
                        let name = element.name
                        let pic = element.pic
                        let remarks = element.state
                        allVideo.push({
                            vod_id: id,
                            vod_name: name,
                            vod_pic: pic,
                            vod_remarks: remarks,
                        })
                    })
                })
                let categories = [
                    {
                        type_id: 1,
                        type_name: '电影',
                    },
                    {
                        type_id: 2,
                        type_name: '电视',
                    },
                    {
                        type_id: 3,
                        type_name: '综艺',
                    },
                    {
                        type_id: 4,
                        type_name: '动漫',
                    },
                    // {
                    //     type_id: 35,
                    //     type_name: '直播',
                    // },
                ]
                backData = parseClassList(allVideo, categories)
            } catch (e) {
                await this.msgtodc(e)
                $.logErr(e)
                backData.error = e.message
            }

            return $.toStr(backData)
        }

        async getVideoList(queryParams) {
            const page = queryParams.pg
            const type = queryParams.t

            if (type === '') return this.getClassList(page)

            let listUrl = `${this.url}/api.php/v2.vod/androidfilter10086?page=${page}&type=${type}`
            let backData = {}
            try {
                let pro = await $.http.get({ url: listUrl, headers: this.headers })
                let proData = pro.body

                let obj = $.toObj(proData)
                let videolist = obj.data
                let videos = []
                videolist.forEach((e) => {
                    let id = e.id
                    let name = e.name
                    let pic = e.pic
                    let remarks = e.state
                    videos.push({
                        vod_id: id,
                        vod_name: name,
                        vod_pic: pic,
                        vod_remarks: remarks,
                    })
                })
                const hasMore = videos.length > 0
                const pgCount = hasMore ? parseInt(page) + 1 : parseInt(page)
                backData = parseVideoList(videos, page, pgCount)
            } catch (e) {
                await this.msgtodc(e)
                $.logErr('Error fetching list:', e)
                backData.error = e.message
            }
            return $.toStr(backData)
        }

        async getVideoDetail(queryParams) {
            let ids = queryParams.ids
            let backData = {}
            try {
                let webUrl = this.url + `/api.php/v3.vod/androiddetail2?vod_id=${ids}`
                let pro = await $.http.get({ url: webUrl, headers: this.headers })
                let proData = pro.body

                let obj = $.toObj(proData)
                let vod_name = obj.data.name
                let vod_content = obj.data.content
                let vod_pic = obj.data.pic

                let vod_play_url = []
                let playlist = obj.data.urls
                playlist.forEach((element) => {
                    let name = element.key
                    let url = element.url
                    url = 'https://ykusu.ykusu/liteapple/api.php/provide/vod?ac=play&url=' + encodeURIComponent(url) + '&n=.m3u8'

                    vod_play_url.push(`${name}$${url}`)
                })

                backData = parseVideoDetail(+ids, vod_name, vod_pic, vod_content, vod_play_url.join('#'))
            } catch (e) {
                await this.msgtodc(e)
                $.logErr(e)
                backData.error = e.message
            }

            return $.toStr(backData)
        }

        async getVideoPlayUrl(queryParams) {
            let backData = {}
            let key = decodeURIComponent(queryParams.url)
            try {
                // m3u8 link requires encrypted headers, but .ts links don't, so return fake response here is easier than return 302 since you can't modify request headers in XPTV.
                let url = 'http://c.xpgtv.net/m3u8/' + key + '.m3u8'
                let headers = {
                    token2: 'enxerhSl0jk2TGhbZCygMdwoKqOmyxsk/Kw8tVy4dsRBE1o1xBhWhoFbh98=',
                    token: 'RXQbgQKl3QkFZkIPGwGvH5kofvCokkkn/a893wC2IId7HQFmy0Eh24osz555X12xGVFxQLTaGuBqU/Y7KU4lStp4UjR7giPxdwoTOsU6R3oc4yZZTQc/yTKh1mH3ckZhx6VsQCEoFf6q',
                    version: 'XPGBOX com.phoenix.tv1.3.3',
                    user_id: 'XPGBOX',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
                    screenx: '1280',
                    screeny: '720',
                }
                headers['timestamp'] = Math.floor(Date.now() / 1e3)
                headers['hash'] = $.CryptoJS.MD5(
                    '||||DC6FFCB55FA||861824127032820||12702720||Asus/Asus/ASUS_I003DD:7.1.2/20171130.376229:user/release-keysXPGBOX com.phoenix.tv1.3.3' +
                        headers['timestamp']
                )
                    .toString()
                    .toLowerCase()
                    .substring(8, 12)
                let res = await $.http.get({ url, headers })
                let body = res.body
                $.isQuanX()
                    ? $.done({ status: 'HTTP/1.1 200', body: body.replace('/m3u8key/', 'http://c.xpgtv.net/m3u8key/') })
                    : $.done({
                          response: {
                              status: 200,
                              body: body.replace('/m3u8key/', 'http://c.xpgtv.net/m3u8key/'),
                          },
                      })
            } catch (e) {
                await this.msgtodc(e)
                $.logErr(e)
                backData.error = e.message
            }
            return $.toStr(backData)
        }

        async searchVideo(queryParams) {
            const pg = queryParams.pg
            const wd = queryParams.wd
            let backData = {}

            try {
                let searchUrl = this.url + `/api.php/v2.vod/androidsearch10086?page=${pg}&wd=${wd}`
                let searchRes = await $.http.get({
                    url: searchUrl,
                    headers: this.headers,
                })
                let proData = $.toObj(searchRes.body)

                let videolist = proData.data
                let videos = []
                videolist.forEach((e) => {
                    let id = e.id
                    let name = e.name
                    let pic = e.pic
                    let remarks = e.state
                    videos.push({
                        vod_id: id,
                        vod_name: name,
                        vod_pic: pic,
                        vod_remarks: remarks,
                    })
                })
                const hasMore = videos.length > 0
                const pgCount = hasMore ? parseInt(pg) + 1 : parseInt(pg)
                backData = parseVideoList(videos, pg, pgCount)
            } catch (e) {
                await this.msgtodc(e)
                $.logErr(e)
                backData.error = e.message
            }

            return $.toStr(backData)
        }
    })()
}

function gzysClass() {
    return new (class extends spider {
        constructor() {
            super()
            this.siteName = '瓜子影視'
            this.url = 'https://api.zaqohu.com'
            this.headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            }
            this.ignoreClassName = []
        }

        async getClassList() {
            let backData = {}
            try {
                let classes = [
                    {
                        type_id: 3,
                        type_name: '热播电影',
                    },
                    { type_name: 'TC搶先看', type_id: 19260 },
                    { type_name: '院線大片', type_id: 15649 },
                    { type_name: '網路新片速遞', type_id: 12814 },
                    { type_name: 'Netflix最新', type_id: 15510 },
                    { type_name: '動作片', type_id: 9153 },
                    { type_name: '\u60AC\u7591\u72AF\u7F6A\u7247', type_id: 12558 },
                    { type_name: '\u559C\u5267\u7247', type_id: 14 },
                    { type_name: '\u60CA\u609A\u6050\u6016\u7247', type_id: 15511 },
                    { type_name: '\u79D1\u5E7B\u9B54\u5E7B\u7247', type_id: 11517 },
                    { type_name: '\u60C5\u611F\u5267\u60C5\u7247', type_id: 466 },
                    { type_name: '\u6218\u4E89\u7247', type_id: 18046 },
                    { type_name: '\u8C46\u74E3\u7535\u5F71TOP250', type_id: 17613 },
                    { type_name: '\u6296\u97F3\u201C\u6BD2\u820C\u7535\u5F71\u201D\u89E3\u8BF4\u539F\u7247', type_id: 16215 },
                    { type_name: '\u5165\u56F4\u5965\u65AF\u5361\u7684LGBT\u7535\u5F71\u7ECF\u5178', type_id: 17054 },
                    { type_name: '\u51B7\u95E8\u60AC\u7591\u4F73\u7247Top20', type_id: 8 },
                    { type_name: '\u5386\u5C4A\u91D1\u9A6C\u5956\u6700\u4F73\u5F71\u7247', type_id: 16308 },
                    { type_name: '\u5386\u5C4A\u91D1\u50CF\u5956\u6700\u4F73\u5F71\u7247', type_id: 16506 },
                    { type_name: '\u5386\u5C4A\u5965\u65AF\u5361\u6700\u4F73\u5F71\u7247', type_id: 16560 },
                    {
                        type_id: 4,
                        type_name: '热播电视剧',
                    },
                    { type_name: '\u7231\u4F18\u817E\u8292\u6700\u65B0', type_id: 16768 },
                    { type_name: 'Netflix', type_id: 16540 },
                    { type_name: '\u6700\u65B0\u65E5\u97E9\u5267', type_id: 16692 },
                    { type_name: '\u6E2F\u5267TVB', type_id: 17473 },
                    { type_name: '\u6700\u65B0\u7F8E\u5267', type_id: 16941 },
                    { type_name: '\u6700\u65B0\u6CF0\u5267', type_id: 18598 },
                    { type_name: '\u9AD8\u5206\u60AC\u7591\u72AF\u7F6A\u5267', type_id: 6611 },
                    { type_name: '\u9AD8\u5206\u7ECF\u5178\u5927\u9646\u5267', type_id: 15386 },
                    { type_name: '\u8FD1\u5E74\u6765\u9AD8\u5206\u53F0\u5267', type_id: 17084 },
                    { type_name: '\u300A9\u53F7\u79D8\u4E8B\u300B\u7CFB\u5217', type_id: 18319 },
                    { type_name: 'Netflix\u83B7\u5956\u5F71\u7247', type_id: 18371 },
                    {
                        type_id: 5,
                        type_name: '热播动漫',
                    },
                    { type_name: '\u4ECA\u65E5\u4E0A\u65B0', type_id: 6175 },
                    { type_name: '\u756A\u5267\u65B0\u70ED\u63A8\u8350', type_id: 10679 },
                    { type_name: '\u56FD\u4EA7\u52A8\u6F2B', type_id: 127 },
                    { type_name: '\u65E5\u672C\u52A8\u6F2B', type_id: 446 },
                    { type_name: '\u6B27\u7F8E\u52A8\u6F2B', type_id: 128 },
                    { type_name: '\u52A8\u6F2B\u7535\u5F71', type_id: 14182 },
                    { type_name: '\u5165\u7AD9\u5FC5\u8FFD\u2726\u7D2F\u8BA12\u4EBF\u8FFD\u756A', type_id: 10772 },
                    { type_name: '\u70ED\u8840\u756A\u5267\u699C', type_id: 8101 },
                    { type_name: '\u5947\u5E7B\u756A\u5267\u699C', type_id: 12655 },
                    { type_name: '\u300A\u6076\u641E\u4E4B\u5BB6\u300B\u7CFB\u5217', type_id: 20215 },
                    { type_name: '\u7403\u7C7B\u8FD0\u52A8\u7CFB\u5217', type_id: 9282 },
                    { type_name: '\u706B\u5F71\u5FCD\u8005\u5267\u573A\u7248\u7CFB\u5217', type_id: 13300 },
                    { type_name: '\u300A\u95F4\u8C0D\u4E9A\u5951\u300B\u7CFB\u5217', type_id: 129 },
                    { type_name: '\u70ED\u8840\u673A\u6218\u7CFB\u5217', type_id: 6163 },
                    {
                        type_id: 6,
                        type_name: '热播综艺',
                    },
                    { type_name: '\u8FD1\u671F\u70ED\u95E8\u7EFC\u827A', type_id: 6663 },
                    { type_name: 'NetFlix\u6700\u65B0\u7EFC\u827A', type_id: 14244 },
                    { type_name: '\u65E5\u97E9\u6700\u65B0\u7EFC\u827A', type_id: 7017 },
                    { type_name: '\u604B\u7231\u751C\u7EFC', type_id: 8249 },
                    { type_name: '\u63A8\u7406\u903B\u8F91\u6574\u86CA', type_id: 8063 },
                    { type_name: '\u751F\u6D3B\u804C\u573A', type_id: 8321 },
                    { type_name: '\u7206\u7B11\u8BED\u8A00\u7EFC\u827A', type_id: 10119 },
                    { type_name: '\u660E\u661F\u5927\u96C6\u5408', type_id: 6757 },
                    { type_name: '\u97F3\u4E50\u6709\u563B\u54C8', type_id: 156 },
                    { type_name: '\u5706\u684C\u6D3E', type_id: 158 },
                    { type_name: '\u536B\u89C6\u70ED\u64AD\u7EFC\u827A', type_id: 9384 },
                ]
                // let videos = [
                //     {
                //         vod_id: 1,
                //         vod_name: '右上角選分類',
                //     },
                // ]
                let videos = []
                let url = `${this.url}/H5/Index/CategoryList`
                let body = { params: '576c9247bb660b67b10050ff8e67f7e2' }
                let res = await $.http.post({
                    url: url,
                    body: $.toStr(body),
                    headers: {
                        'User-Agent': this.headers['User-Agent'],
                        'Content-Type': 'application/json',
                    },
                })
                let resBody = this.aesDecode($.toObj(res.body).data, '181cc88340ae5b2b', '4423d1e2773476ce', 'hex')
                let list = $.toObj(resBody).list
                list.forEach((e) => {
                    let vods = e.list
                    vods.forEach((i) => {
                        videos.push({
                            vod_id: +i.vod_id,
                            vod_name: i.vod_name || i.c_name,
                            vod_pic: i.vod_pic || i.c_pic,
                            vod_remarks: i.vod_continu || '',
                        })
                    })
                })

                backData = parseClassList(videos, classes)
            } catch (e) {
                await this.msgtodc(e)
                $.logErr(e)
                backData.error = e.message
            }

            return $.toStr(backData)
        }

        async getVideoList(queryParams) {
            const page = queryParams.pg
            const type = queryParams.t
            if (type === '') return this.getClassList()

            let listUrl = `${this.url}/H5/Category/GetChoiceList`
            let params = { pid: type, pageSize: 24, page: page }
            if (type > 6) {
                function findKeyByValue(input) {
                    let obj = {
                        3: [19260, 15649, 12814, 15510, 9153, 12558, 14, 15511, 11517, 466, 18046, 17613, 16215, 17054, 8, 16308, 16506, 16560],
                        4: [16768, 16540, 16692, 17473, 16941, 18598, 6611, 15386, 17084, 18319, 18371],
                        5: [6175, 10679, 127, 446, 128, 14182, 10772, 8101, 12655, 20215, 9282, 13300, 129, 6163],
                        6: [6663, 14244, 7017, 8249, 8063, 8321, 10119, 6757, 156, 158, 9384],
                    }
                    for (const key in obj) {
                        if (obj[key].includes(input)) {
                            return parseInt(key)
                        }
                    }
                    return null
                }
                let pid = findKeyByValue(+type)
                listUrl = `${this.url}/H5/Category/GetModuleList`
                params = { show_id: type, show_pid: pid, pageSize: 24, page: page }
            }
            let enbody = this.aesEncode($.toStr(params), '181cc88340ae5b2b', '4423d1e2773476ce', 'hex')
            let backData = {}
            try {
                let pro = await $.http.post({
                    url: listUrl,
                    headers: {
                        'User-Agent': this.headers['User-Agent'],
                        'Content-Type': 'application/json',
                    },
                    body: $.toStr({ params: enbody }),
                })

                let data = this.aesDecode($.toObj(pro.body).data, '181cc88340ae5b2b', '4423d1e2773476ce', 'hex')
                let obj = $.toObj(data)
                let allVideo = obj.list
                let videos = []
                allVideo.forEach((e) => {
                    let vodUrl = e.vod_id || ''
                    let vodPic = e.c_pic || e.vod_pic
                    let vodName = e.c_name || e.vod_name
                    let vodDiJiJi = e.vod_continu || ''

                    let videoDet = {}
                    videoDet.vod_id = +vodUrl
                    videoDet.vod_pic = vodPic
                    videoDet.vod_name = vodName.trim()
                    videoDet.vod_remarks = vodDiJiJi.trim()
                    videos.push(videoDet)
                })
                const hasMore = videos.length > 0
                const pgCount = hasMore ? parseInt(page) + 1 : parseInt(page)

                backData = parseVideoList(videos, page, pgCount)
            } catch (e) {
                await this.msgtodc(e)
                $.logErr('Error fetching list:', e)
                backData.error = e.message
            }
            return $.toStr(backData)
        }

        async getVideoDetail(queryParams) {
            let ids = queryParams.ids
            let backData = {}
            try {
                let webUrl = `${this.url}/H5/Resource/GetVodInfo`
                let params = { vod_id: ids }
                let enbody = this.aesEncode($.toStr(params), '181cc88340ae5b2b', '4423d1e2773476ce', 'hex')
                let pro = await $.http.post({
                    url: webUrl,
                    headers: {
                        'User-Agent': this.headers['User-Agent'],
                        'Content-Type': 'application/json',
                    },
                    body: $.toStr({ params: enbody }),
                })
                let proData = pro.body

                let data = this.aesDecode($.toObj(proData).data, '181cc88340ae5b2b', '4423d1e2773476ce', 'hex')
                let obj = $.toObj(data).vodInfo
                let vod_name = obj.vod_name || ''
                let vod_content = obj.vod_use_content || ''
                let vod_pic = obj.pic || ''

                // get playlist
                let playlistUrl = `${this.url}/H5/Resource/GetOnePlayList`
                let params2 = { vod_id: ids, pageSize: 10000, page: 1 }
                let enbody2 = this.aesEncode($.toStr(params2), '181cc88340ae5b2b', '4423d1e2773476ce', 'hex')
                let playres = await $.http.post({
                    url: playlistUrl,
                    headers: {
                        'User-Agent': this.headers['User-Agent'],
                        'Content-Type': 'application/json',
                    },
                    body: $.toStr({ params: enbody2 }),
                })
                let body = playres.body
                let data2 = this.aesDecode($.toObj(body).data, '181cc88340ae5b2b', '4423d1e2773476ce', 'hex')
                let json = $.toObj(data2)
                let vod_play_url = json.urls.map((item) => item.name + '$' + item.url).join('#')

                backData = parseVideoDetail(+ids, vod_name, vod_pic, vod_content, vod_play_url)
            } catch (e) {
                await this.msgtodc(e)
                $.logErr(e)
                backData.error = e.message
            }

            return $.toStr(backData)
        }

        // async getVideoPlayUrl(queryParams) {
        //     let backData = {}
        //     let url = decodeURIComponent(queryParams.url)
        //     try {
        //         backData.data = url
        //     } catch (e) {
        //         await this.msgtodc(e)
        //         $.logErr(e)
        //         backData.error = e.message
        //     }
        //     return $.toStr(backData)
        // }

        async searchVideo(queryParams) {
            const pg = queryParams.pg
            const wd = queryParams.wd
            let backData = {}

            try {
                let url = base64Decode('aHR0cHM6Ly95a2suNDk4MjQ2Lnh5ei9hcGkucGhwL2d6YXBw') + `?ac=detail&wd=${wd}&pg=${pg}`
                let res = await $.http.get(url)
                let list = $.toObj(res.body).list
                let videos = []
                list.forEach((e) => {
                    videos.push({
                        vod_id: +e.vod_id,
                        vod_name: e.vod_name,
                        vod_pic: e.vod_pic,
                        vod_remarks: '',
                    })
                })
                backData = parseVideoList(videos, '1', '1')
            } catch (e) {
                await this.msgtodc(e)
                $.logErr(e)
                backData.error = e.message
            }

            return $.toStr(backData)
        }

        aesEncode(str, keyStr, ivStr, type) {
            const key = $.CryptoJS.enc.Utf8.parse(keyStr)
            let encData = $.CryptoJS.AES.encrypt(str, key, {
                iv: $.CryptoJS.enc.Utf8.parse(ivStr),
                mode: $.CryptoJS.mode.CBC,
                padding: $.CryptoJS.pad.Pkcs7,
            })
            if (type === 'hex') return encData.ciphertext.toString($.CryptoJS.enc.Hex)
            return encData.toString($.CryptoJS.enc.Utf8)
        }

        aesDecode(str, keyStr, ivStr, type) {
            const key = $.CryptoJS.enc.Utf8.parse(keyStr)
            if (type === 'hex') {
                str = $.CryptoJS.enc.Hex.parse(str)
                return $.CryptoJS.AES.decrypt(
                    {
                        ciphertext: str,
                    },
                    key,
                    {
                        iv: $.CryptoJS.enc.Utf8.parse(ivStr),
                        mode: $.CryptoJS.mode.CBC,
                        padding: $.CryptoJS.pad.Pkcs7,
                    }
                ).toString($.CryptoJS.enc.Utf8)
            } else {
                return $.CryptoJS.AES.decrypt(str, key, {
                    iv: $.CryptoJS.enc.Utf8.parse(ivStr),
                    mode: $.CryptoJS.mode.CBC,
                    padding: $.CryptoJS.pad.Pkcs7,
                }).toString($.CryptoJS.enc.Utf8)
            }
        }
    })()
}

// Utils

/**
 * @description 返回分類列表
 * @param {Array} allVideos 首頁內容
 * @param {Array} allClasses 分類內容
 * @returns {Object}
 */
function parseClassList(allVideos, allClasses) {
    let backData = {
        code: 1,
        msg: '數據列表',
        page: 1,
        list: allVideos,
        class: allClasses,
    }

    return backData
}

/**
 * @description 獲取列表
 * @param {Array} videos
 * @param {*} page 當前頁
 * @param {*} lastPage 最後頁
 * @returns {Object}
 */
function parseVideoList(videos, page, lastPage) {
    let backData = {
        code: 1,
        msg: '數據列表',
        page: page.toString(),
        pagecount: parseInt(lastPage),
        limit: videos.length.toString(),
        total: videos.length * lastPage,
        list: videos,
    }

    return backData
}

/**
 * @description 獲取詳情
 * @param {Number} id
 * @param {String} name
 * @param {String} pic
 * @param {String} content
 * @param {String} playUrl
 * @returns {Object}
 */
function parseVideoDetail(id, name, pic, content, playUrl) {
    let backData = {
        code: 1,
        msg: '数据列表',
        page: 1,
        pagecount: 1,
        limit: '20',
        total: 1,
        list: [
            {
                vod_id: id,
                vod_name: name,
                vod_pic: pic,
                vod_remarks: '',
                type_name: '',
                vod_year: '',
                vod_area: '',
                vod_actor: '',
                vod_director: '',
                vod_content: content,
                vod_play_from: '',
                vod_play_url: playUrl,
            },
        ],
    }

    return backData
}

function base64Encode(text) {
    return $.CryptoJS.enc.Base64.stringify($.CryptoJS.enc.Utf8.parse(text))
}

function base64Decode(text) {
    return $.CryptoJS.enc.Utf8.stringify($.CryptoJS.enc.Base64.parse(text))
}

// an URI [ parse | stringify ] to JSON / URI Converter based JavaScript
// https://github.com/VirgilClyne/GetSomeFries/blob/main/function/URI/URIs.embedded.min.js
// prettier-ignore
function URIs(t){return new class{constructor(t=[]){this.name="URI v1.2.6",this.opts=t,this.json={scheme:"",host:"",path:"",query:{}}}parse(t){let s=t.match(/(?:(?<scheme>.+):\/\/(?<host>[^/]+))?\/?(?<path>[^?]+)?\??(?<query>[^?]+)?/)?.groups??null;if(s?.path?s.paths=s.path.split("/"):s.path="",s?.paths){const t=s.paths[s.paths.length-1];if(t?.includes(".")){const e=t.split(".");s.format=e[e.length-1]}}return s?.query&&(s.query=Object.fromEntries(s.query.split("&").map((t=>t.split("="))))),s}stringify(t=this.json){let s="";return t?.scheme&&t?.host&&(s+=t.scheme+"://"+t.host),t?.path&&(s+=t?.host?"/"+t.path:t.path),t?.query&&(s+="?"+Object.entries(t.query).map((t=>t.join("="))).join("&")),s}}(t)}
// modified from @Yuheng0101
// prettier-ignore
async function importRemoteUtils(n,t,i,r){const u=function(){return typeof globalThis!="undefined"?globalThis:typeof self!="undefined"?self:typeof window!="undefined"?window:global}();if($.isNode()){if(r){$.debug(`【${i}】使用 'require' 导入模块 ${r}`);try{const n=require(r);$[i]=n;return}catch(o){$.error(`【${i}】导入模块 ${r} 失败, 请检查模块名或检查是否安装该依赖...`)}}else if($.debug(`【${i}】没有传入模块名称, 不使用 'require' 导入`),u[i]){$.debug(`【${i}】环境自带库, 已加载成功 🎉`);$[i]=u[i];return}!$[i]||$.debug(`【${i}】使用远程加载...`)}$.debug(`【${i}】正在从远程拉取脚本: ${n}`);const f=$.getval(`ykusu-${i}.js`),e=n=>{eval(n),$[i]=t?eval(t)():u[i],!$[i]||$.debug(`【${i}】加载成功 🎉`)};f?($.debug(`【${i}】缓存存在, 尝试加载...`),e(f)):await $.http.get({url:n,timeout:2e3}).then(n=>{var t=n.body;e(t);$.setval(t,`ykusu-${i}.js`);$.debug(`【${i}】已存入缓存 🎉`)}).catch(()=>Promise.reject(new Error(`【${i}】远程拉取失败, 请检查网络...`)))}
// prettier-ignore
function Env(t,e){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;"POST"===e&&(s=this.post);const i=new Promise(((e,i)=>{s.call(this,t,((t,s,o)=>{t?i(t):e(s)}))}));return t.timeout?((t,e=1e3)=>Promise.race([t,new Promise(((t,s)=>{setTimeout((()=>{s(new Error("请求超时"))}),e)}))]))(i,t.timeout):i}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.logLevels={debug:0,info:1,warn:2,error:3},this.logLevelPrefixs={debug:"[DEBUG] ",info:"[INFO] ",warn:"[WARN] ",error:"[ERROR] "},this.logLevel="info",this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.encoding="utf-8",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`🔔${this.name}, 开始!`)}getEnv(){return"undefined"!=typeof $environment&&$environment["surge-version"]?"Surge":"undefined"!=typeof $environment&&$environment["stash-version"]?"Stash":"undefined"!=typeof module&&module.exports?"Node.js":"undefined"!=typeof $task?"Quantumult X":"undefined"!=typeof $loon?"Loon":"undefined"!=typeof $rocket?"Shadowrocket":void 0}isNode(){return"Node.js"===this.getEnv()}isQuanX(){return"Quantumult X"===this.getEnv()}isSurge(){return"Surge"===this.getEnv()}isLoon(){return"Loon"===this.getEnv()}isShadowrocket(){return"Shadowrocket"===this.getEnv()}isStash(){return"Stash"===this.getEnv()}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null,...s){try{return JSON.stringify(t,...s)}catch{return e}}getjson(t,e){let s=e;if(this.getdata(t))try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise((e=>{this.get({url:t},((t,s,i)=>e(i)))}))}runScript(t,e){return new Promise((s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let o=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");o=o?1*o:20,o=e&&e.timeout?e.timeout:o;const[r,a]=i.split("@"),n={url:`http://${a}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:o},headers:{"X-Key":r,Accept:"*/*"},policy:"DIRECT",timeout:o};this.post(n,((t,e,i)=>s(i)))})).catch((t=>this.logErr(t)))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),o=JSON.stringify(this.data);s?this.fs.writeFileSync(t,o):i?this.fs.writeFileSync(e,o):this.fs.writeFileSync(t,o)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let o=t;for(const t of i)if(o=Object(o)[t],void 0===o)return s;return o}lodash_set(t,e,s){return Object(t)!==t||(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce(((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{}),t)[e[e.length-1]]=s),t}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),o=s?this.getval(s):"";if(o)try{const t=JSON.parse(o);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,o]=/^@(.*?)\.(.*?)$/.exec(e),r=this.getval(i),a=i?"null"===r?null:r||"{}":"{}";try{const e=JSON.parse(a);this.lodash_set(e,o,t),s=this.setval(JSON.stringify(e),i)}catch(e){const r={};this.lodash_set(r,o,t),s=this.setval(JSON.stringify(r),i)}}else s=this.setval(t,e);return s}getval(t){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":return $persistentStore.read(t);case"Quantumult X":return $prefs.valueForKey(t);case"Node.js":return this.data=this.loaddata(),this.data[t];default:return this.data&&this.data[t]||null}}setval(t,e){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":return $persistentStore.write(t,e);case"Quantumult X":return $prefs.setValueForKey(t,e);case"Node.js":return this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0;default:return this.data&&this.data[e]||null}}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.cookie&&void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar)))}get(t,e=(()=>{})){switch(t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"],delete t.headers["content-type"],delete t.headers["content-length"]),t.params&&(t.url+="?"+this.queryStr(t.params)),void 0===t.followRedirect||t.followRedirect||((this.isSurge()||this.isLoon())&&(t["auto-redirect"]=!1),this.isQuanX()&&(t.opts?t.opts.redirection=!1:t.opts={redirection:!1})),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,((t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status?s.status:s.statusCode,s.status=s.statusCode),e(t,s,i)}));break;case"Quantumult X":this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then((t=>{const{statusCode:s,statusCode:i,headers:o,body:r,bodyBytes:a}=t;e(null,{status:s,statusCode:i,headers:o,body:r,bodyBytes:a},r,a)}),(t=>e(t&&t.error||"UndefinedError")));break;case"Node.js":let s=require("iconv-lite");this.initGotEnv(t),this.got(t).on("redirect",((t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}})).then((t=>{const{statusCode:i,statusCode:o,headers:r,rawBody:a}=t,n=s.decode(a,this.encoding);e(null,{status:i,statusCode:o,headers:r,rawBody:a,body:n},n)}),(t=>{const{message:i,response:o}=t;e(i,o,o&&s.decode(o.rawBody,this.encoding))}));break}}post(t,e=(()=>{})){const s=t.method?t.method.toLocaleLowerCase():"post";switch(t.body&&t.headers&&!t.headers["Content-Type"]&&!t.headers["content-type"]&&(t.headers["content-type"]="application/x-www-form-urlencoded"),t.headers&&(delete t.headers["Content-Length"],delete t.headers["content-length"]),void 0===t.followRedirect||t.followRedirect||((this.isSurge()||this.isLoon())&&(t["auto-redirect"]=!1),this.isQuanX()&&(t.opts?t.opts.redirection=!1:t.opts={redirection:!1})),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient[s](t,((t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status?s.status:s.statusCode,s.status=s.statusCode),e(t,s,i)}));break;case"Quantumult X":t.method=s,this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then((t=>{const{statusCode:s,statusCode:i,headers:o,body:r,bodyBytes:a}=t;e(null,{status:s,statusCode:i,headers:o,body:r,bodyBytes:a},r,a)}),(t=>e(t&&t.error||"UndefinedError")));break;case"Node.js":let i=require("iconv-lite");this.initGotEnv(t);const{url:o,...r}=t;this.got[s](o,r).then((t=>{const{statusCode:s,statusCode:o,headers:r,rawBody:a}=t,n=i.decode(a,this.encoding);e(null,{status:s,statusCode:o,headers:r,rawBody:a,body:n},n)}),(t=>{const{message:s,response:o}=t;e(s,o,o&&i.decode(o.rawBody,this.encoding))}));break}}time(t,e=null){const s=e?new Date(e):new Date;let i={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in i)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?i[e]:("00"+i[e]).substr((""+i[e]).length)));return t}queryStr(t){let e="";for(const s in t){let i=t[s];null!=i&&""!==i&&("object"==typeof i&&(i=JSON.stringify(i)),e+=`${s}=${i}&`)}return e=e.substring(0,e.length-1),e}msg(e=t,s="",i="",o={}){const r=t=>{const{$open:e,$copy:s,$media:i,$mediaMime:o}=t;switch(typeof t){case void 0:return t;case"string":switch(this.getEnv()){case"Surge":case"Stash":default:return{url:t};case"Loon":case"Shadowrocket":return t;case"Quantumult X":return{"open-url":t};case"Node.js":return}case"object":switch(this.getEnv()){case"Surge":case"Stash":case"Shadowrocket":default:{const r={};let a=t.openUrl||t.url||t["open-url"]||e;a&&Object.assign(r,{action:"open-url",url:a});let n=t["update-pasteboard"]||t.updatePasteboard||s;if(n&&Object.assign(r,{action:"clipboard",text:n}),i){let t,e,s;if(i.startsWith("http"))t=i;else if(i.startsWith("data:")){const[t]=i.split(";"),[,o]=i.split(",");e=o,s=t.replace("data:","")}else{e=i,s=(t=>{const e={JVBERi0:"application/pdf",R0lGODdh:"image/gif",R0lGODlh:"image/gif",iVBORw0KGgo:"image/png","/9j/":"image/jpg"};for(var s in e)if(0===t.indexOf(s))return e[s];return null})(i)}Object.assign(r,{"media-url":t,"media-base64":e,"media-base64-mime":o??s})}return Object.assign(r,{"auto-dismiss":t["auto-dismiss"],sound:t.sound}),r}case"Loon":{const s={};let o=t.openUrl||t.url||t["open-url"]||e;o&&Object.assign(s,{openUrl:o});let r=t.mediaUrl||t["media-url"];return i?.startsWith("http")&&(r=i),r&&Object.assign(s,{mediaUrl:r}),console.log(JSON.stringify(s)),s}case"Quantumult X":{const o={};let r=t["open-url"]||t.url||t.openUrl||e;r&&Object.assign(o,{"open-url":r});let a=t["media-url"]||t.mediaUrl;i?.startsWith("http")&&(a=i),a&&Object.assign(o,{"media-url":a});let n=t["update-pasteboard"]||t.updatePasteboard||s;return n&&Object.assign(o,{"update-pasteboard":n}),console.log(JSON.stringify(o)),o}case"Node.js":return}default:return}};if(!this.isMute)switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:$notification.post(e,s,i,r(o));break;case"Quantumult X":$notify(e,s,i,r(o));break;case"Node.js":break}if(!this.isMuteLog){let t=["","==============📣系统通知📣=============="];t.push(e),s&&t.push(s),i&&t.push(i),console.log(t.join("\n")),this.logs=this.logs.concat(t)}}debug(...t){this.logLevels[this.logLevel]<=this.logLevels.debug&&(t.length>0&&(this.logs=[...this.logs,...t]),console.log(`${this.logLevelPrefixs.debug}${t.map((t=>t??String(t))).join(this.logSeparator)}`))}info(...t){this.logLevels[this.logLevel]<=this.logLevels.info&&(t.length>0&&(this.logs=[...this.logs,...t]),console.log(`${this.logLevelPrefixs.info}${t.map((t=>t??String(t))).join(this.logSeparator)}`))}warn(...t){this.logLevels[this.logLevel]<=this.logLevels.warn&&(t.length>0&&(this.logs=[...this.logs,...t]),console.log(`${this.logLevelPrefixs.warn}${t.map((t=>t??String(t))).join(this.logSeparator)}`))}error(...t){this.logLevels[this.logLevel]<=this.logLevels.error&&(t.length>0&&(this.logs=[...this.logs,...t]),console.log(`${this.logLevelPrefixs.error}${t.map((t=>t??String(t))).join(this.logSeparator)}`))}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.map((t=>t??String(t))).join(this.logSeparator))}logErr(t,e){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":case"Quantumult X":default:this.log("",`❗️${this.name}, 错误!`,e,t);break;case"Node.js":this.log("",`❗️${this.name}, 错误!`,e,void 0!==t.message?t.message:t,t.stack);break}}wait(t){return new Promise((e=>setTimeout(e,t)))}done(t={}){const e=((new Date).getTime()-this.startTime)/1e3;switch(this.log("",`🔔${this.name}, 结束! 🕛 ${e} 秒`),this.log(),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":case"Quantumult X":default:$done(t);break;case"Node.js":process.exit(1)}}}(t,e)}
