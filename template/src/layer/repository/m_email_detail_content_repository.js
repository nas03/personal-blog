const { flag, decisionMethod } = require('constant')

const db = require('db').helper

async function getTemplateNameEmailDropdown(siteId) {
  const result =
    await db('m_email_detail_content as d')
      .join('m_general_category as c', 'd.category_id', 'c.id')
      .join('m_email_common_content as t', 'd.email_common_content_id', 't.id')
      .select(
        'd.id',
        db.raw('CONCAT("【 ",c.category_code,". ",c.ja_category_name, "】") as ja_category_name'),
        db.raw('CONCAT("【 ",c.category_code,". ",c.en_category_name, "】") as en_category_name'),
        db.raw('CONCAT("【 ",c.category_code,". ",c.cn_category_name, "】") as cn_category_name'),
        db.raw('CONCAT("【 ",c.category_code,". ",c.kr_category_name, "】") as kr_category_name'),

        db.raw('CONCAT(c.category_code,"-",d.email_code, ". ", d.en_email_name) as en_email_name'),
        db.raw('CONCAT(c.category_code,"-",d.email_code, ". ", d.ja_email_name) as ja_email_name'),
        db.raw('CONCAT(c.category_code,"-",d.email_code, ". ", d.cn_email_name) as cn_email_name'),
        db.raw('CONCAT(c.category_code,"-",d.email_code, ". ", d.kr_email_name) as kr_email_name'),

      )
      .where('d.delete_flag', flag.FALSE)
      .where('c.delete_flag', flag.FALSE)
      .where('d.decision_method', decisionMethod.MANUAL)
      .where('t.site_id', siteId)
      .orderBy('c.category_code', 'asc')
      .orderBy('email_code', 'asc')

  return result
}

async function getTemplateSendEmailById(id) {
  const result =
    await db('m_email_detail_content as d')
      .join('m_email_common_content as c', 'd.email_common_content_id', 'c.id')
      .select(
        'd.id',
        db.raw("CONCAT(d.site_name, ' ', d.en_subject) as en_subject"),
        db.raw("CONCAT(d.site_name, ' ', d.ja_subject) as ja_subject"),
        db.raw("CONCAT(d.site_name, ' ', d.cn_subject) as cn_subject"),
        db.raw("CONCAT(d.site_name, ' ', d.kr_subject) as kr_subject"),
        'd.en_email_name',
        'd.ja_email_name',
        'd.cn_email_name',
        'd.kr_email_name',
        'd.en_content',
        'd.ja_content',
        'd.cn_content',
        'd.kr_content',
        'd.env_email_from_setting',
        'd.env_email_bcc_setting',
        'c.site_id',
        'c.en_header',
        'c.ja_header',
        'c.cn_header',
        'c.kr_header',
        'c.en_footer',
        'c.ja_footer',
        'c.kr_footer',
        'c.cn_footer',
        'c.en_container',
        'c.ja_container',
        'c.cn_container',
        'c.kr_container',
      )
      .where('d.delete_flag', flag.FALSE)
      .where('c.delete_flag', flag.FALSE)
      .where('d.id', id)
      .first()

  return result
}

module.exports = {
  getTemplateNameEmailDropdown,
  getTemplateSendEmailById,
}
