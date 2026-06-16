//  2026-04-28
//  树先生
//  当前文件内容仅供个人学习和研究使用，若使用过程中发生任何问题概不负责

let url = $request.url;
let body = $response.body;
let obj = JSON.parse(body);

//  基础精简页面
if (url.indexOf("config/v3/basic") != -1) {
  //  启动默认tab为‘发现’
  obj.data.bottomBarControl.defaultTab = "discover";
  //  发现tab顶部右上角的角标
  obj.data.discoverPageConfigs.toolsBar = {};

  //  底部tab选项卡：禁用日程和课程
  if (obj && obj.data && obj.data.bottomBarControl && obj.data.bottomBarControl.tabs && Array.isArray(obj.data.bottomBarControl.tabs)) {
      // 遍历数组，只保留name为"运动"、"发现"、"我的"的元素
      obj.data.bottomBarControl.tabs = obj.data.bottomBarControl.tabs.filter(item => {
          return item && (item.name === '运动' || item.name === '发现' || item.name === '我的');
      });
  }

  //  发现tab顶部菜单
  if (obj && obj.data && obj.data.discoverPageConfigs && obj.data.discoverPageConfigs.discoverTabs && Array.isArray(obj.data.discoverPageConfigs.discoverTabs)) {
      // 遍历数组，保留name为"推荐"和"社区"的元素
      // obj.data.discoverPageConfigs.discoverTabs = obj.data.discoverPageConfigs.discoverTabs.filter(item => {
      //     return item && (item.name === '推荐' || item.name === '社区');
      // });
  
      // 找到name为"推荐"的元素，设置其default值为true
      obj.data.discoverPageConfigs.discoverTabs.forEach(item => {
          if (item && item.name === '推荐') {
              item.default = true;
          } else {
              item.default = false;
          }

          if (item.showAd) {
              item.showAd = false;
          }
      });
  }

} 

body = JSON.stringify(obj);
$done({body});
