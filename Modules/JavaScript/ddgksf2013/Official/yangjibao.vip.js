/***********************************

养基宝 Pro

***********************************/


hostname=*.yangjibao.com

^https?:\/\/.*yangjibao\.com\/.*\/account|vip_info url jsonjq-response-body '.data.vip_label=true|.data.vip_expiry_date="2099-12-31"|.data.is_pay=true'
^https?:\/\/.*yangjibao.com\/unify_ad url jsonjq-response-body '.data=null'
