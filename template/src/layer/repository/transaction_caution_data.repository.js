const { helper: db } = require('db')
const { flag } = require('constant')
const getTransactionCaution = (name_romaji, dob) => {
  return db.from('transaction_caution_data as tcd')
    .leftJoin('users_basic_data as admin', 'tcd.staff_id', 'admin.id')
    .leftJoin('m_countries as nation', 'tcd.nationality', 'nation.id')
    .leftJoin('m_countries as residence', 'tcd.residence', 'residence.id')
    .leftJoin('m_risk_reasons as risk', 'tcd.risk_reason_id', 'risk.id')
    .where('tcd.name_romaji', db.raw(`"${name_romaji}"`))
    .andWhere('tcd.date_of_birth', dob)
    .andWhere('tcd.delete_flag', flag.FALSE)
    .select(
      'tcd.ts_regist as registration_date',
      db.raw('CONCAT(LEFT(admin.last_name_romaji,1),".",admin.first_name_romaji) as staff_name'),
      'nation.country_name as nationality',
      'residence.country_name as residence',
      'tcd.name_romaji as name_romaji',
      'tcd.name_kanji as name_kanji',
      'tcd.date_of_birth as date_of_birth',
      'tcd.gender as gender',
      'tcd.information_source as information_source',
      'risk.ja_risk_reason as ja_risk_reason',
      'risk.en_risk_reason as en_risk_reason',
      'risk.cn_risk_reason as cn_risk_reason',
      'risk.kr_risk_reason as kr_risk_reason',
      'risk.ja_risk_reason_detail as ja_risk_reason_detail',
      'risk.en_risk_reason_detail as en_risk_reason_detail',
      'risk.cn_risk_reason_detail as cn_risk_reason_detail',
      'risk.kr_risk_reason_detail as kr_risk_reason_detail',
    )
}

module.exports = {
  getTransactionCaution,
}
