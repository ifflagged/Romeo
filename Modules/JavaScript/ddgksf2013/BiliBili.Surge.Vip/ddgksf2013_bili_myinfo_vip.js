if ($response.body) {
    try {
        let obj = JSON.parse($response.body);

        if (obj && obj.data) {
            obj.data.vip = {
                "type": 2,
                "status": 1,
                "due_date": 4070880000000,
                "vip_pay_type": 0,
                "theme_type": 0,
                "role": 3,
                "avatar_subscript": 1,
                "avatar_subscript_url": "",
                "nickname_color": "#FB7299",
                "tv_vip_status": 0,
                "tv_vip_pay_type": 0,
                "tv_due_date": 0,
                "super_vip": {
                    "is_super_vip": false
                },
                "ott_info": {
                    "pay_type": 0,
                    "vip_type": 0,
                    "status": 0,
                    "pay_channel_id": "",
                    "overdue_time": 0
                },
                "avatar_icon": {
                    "icon_resource": {}
                },
                "label": {
                    "path": "",
                    "text": "年度大会员",
                    "label_theme": "annual_vip",
                    "text_color": "#ffffff",
                    "bg_style": 1,
                    "bg_color": "#FB7299",
                    "border_color": "#ffffff",
                    "use_img_label": true,
                    "image": "https://i0.hdslb.com/bfs/activity-plat/static/20230907/e41bd47e5579cfff81770e41f5107ba2/WIOlCPa1Ch.png",
                    "img_label_uri_hans_static": "https://i0.hdslb.com/bfs/vip/d7b702ef65a976b20ed854cbd04cb9e27341bb79.png",
                    "img_label_uri_hant_static": "https://i0.hdslb.com/bfs/activity-plat/static/20220614/e369244d0b14644f5e1a06431e22a4d5/KJunwh19T5.png",
                    "img_label_uri_hans": "",
                    "img_label_uri_hant": "",
                    "img_label_uri_i18n": "",
                    "img_label_uri_i18n_static": "",
                    "label_id": 0,
                    "label_type": 0,
                    "label_goto": null
                }
            };
        }

        $done({ body: JSON.stringify(obj) });
    } catch (e) {
        $done({});
    }
} else {
    $done({});
}
