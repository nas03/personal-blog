const { ekycAuthenticationType } = require('constant')

// ============FXON============
const fxonPersonal = [
  // -------FXON Personal-------
  {
    reg_category: 0,
    numbers_of_personal: 1,
    numbers_of_company: 0,
    authentication_type: [
      ekycAuthenticationType.Identification_Auth,
      ekycAuthenticationType.PoA_Auth,
    ],
    percent: 50,
  },
  // -------FXON Company-------
  // -------1 Personal + 1 Company-------
  {
    reg_category: 1,
    numbers_of_personal: 1,
    numbers_of_company: 1,
    authentication_type: [ekycAuthenticationType.Identification_Auth],
    percent: 30,
  },
  {
    reg_category: 1,
    numbers_of_personal: 1,
    numbers_of_company: 1,
    authentication_type: [ekycAuthenticationType.PoA_Auth],
    percent: 20,
  },
  // -------2 Personal + 1 Company-------
  {
    reg_category: 1,
    numbers_of_personal: 2,
    numbers_of_company: 1,
    authentication_type: [ekycAuthenticationType.Identification_Auth],
    percent: 20,
  },
  {
    reg_category: 1,
    numbers_of_personal: 2,
    numbers_of_company: 1,
    authentication_type: [ekycAuthenticationType.PoA_Auth],
    percent: 10,
  },
]

// ============ICPAY============
const icpayPersonalMNC = [
  // -------ICPAY Personal-------
  {
    reg_category: 0,
    is_iden_c: true,
    numbers_of_personal: 1,
    numbers_of_company: 0,
    authentication_type: [ekycAuthenticationType.Identification_Auth],
    percent: 100,
  },
  {
    reg_category: 0,
    is_iden_c: false,
    numbers_of_personal: 1,
    numbers_of_company: 0,
    authentication_type: [
      ekycAuthenticationType.Identification_Auth,
      ekycAuthenticationType.MNC_Auth,
    ],
    percent: 50,
  },
  // -------ICPAY Company-------
  // -------1 Personal + 1 Company-------
  {
    reg_category: 1,
    is_iden_c: true,
    numbers_of_personal: 1,
    numbers_of_company: 1,
    authentication_type: [ekycAuthenticationType.Identification_Auth],
    percent: 50,
  },
  {
    reg_category: 1,
    is_iden_c: false,
    numbers_of_personal: 1,
    numbers_of_company: 1,
    authentication_type: [
      ekycAuthenticationType.Identification_Auth,
      ekycAuthenticationType.MNC_Auth,
    ],
    percent: 25,
  },
  // -------2 Personal + 1 Company-------
  {
    reg_category: 1,
    is_iden_c: true,
    numbers_of_personal: 2,
    numbers_of_company: 1,
    authentication_type: [ekycAuthenticationType.Identification_Auth],
    percent: 30,
  },
  {
    reg_category: 1,
    is_iden_c: false,
    numbers_of_personal: 2,
    numbers_of_company: 1,
    authentication_type: [
      ekycAuthenticationType.Identification_Auth,
      ekycAuthenticationType.MNC_Auth,
    ],
    percent: 15,
  },
  // -------3 Personal + 1 Company-------
  {
    reg_category: 1,
    is_iden_c: true,
    numbers_of_personal: 3,
    numbers_of_company: 1,
    authentication_type: [ekycAuthenticationType.Identification_Auth],
    percent: 20,
  },
  {
    reg_category: 1,
    is_iden_c: false,
    numbers_of_personal: 3,
    numbers_of_company: 1,
    authentication_type: [
      ekycAuthenticationType.Identification_Auth,
      ekycAuthenticationType.MNC_Auth,
    ],
    percent: 10,
  },
  // -------4 Personal + 1 Company-------
  {
    reg_category: 1,
    is_iden_c: true,
    numbers_of_personal: 4,
    numbers_of_company: 1,
    authentication_type: [ekycAuthenticationType.Identification_Auth],
    percent: 15,
  },
  {
    reg_category: 1,
    is_iden_c: false,
    numbers_of_personal: 4,
    numbers_of_company: 1,
    authentication_type: [ekycAuthenticationType.Identification_Auth],
    percent: 10,
  },
  {
    reg_category: 1,
    is_iden_c: false,
    numbers_of_personal: 4,
    numbers_of_company: 1,
    authentication_type: [ekycAuthenticationType.MNC_Auth],
    percent: 5,
  },
  // -------5 Personal + 1 Company-------
  {
    reg_category: 1,
    is_iden_c: true,
    numbers_of_personal: 5,
    numbers_of_company: 1,
    authentication_type: [ekycAuthenticationType.Identification_Auth],
    percent: 12,
  },
  {
    reg_category: 1,
    is_iden_c: false,
    numbers_of_personal: 5,
    numbers_of_company: 1,
    authentication_type: [
      ekycAuthenticationType.Identification_Auth,
      ekycAuthenticationType.MNC_Auth,
    ],
    percent: 6,
  },
  // -------6 Personal + 1 Company-------
  {
    reg_category: 1,
    is_iden_c: true,
    numbers_of_personal: 6,
    numbers_of_company: 1,
    authentication_type: [ekycAuthenticationType.Identification_Auth],
    percent: 10,
  },
  {
    reg_category: 1,
    is_iden_c: false,
    numbers_of_personal: 6,
    numbers_of_company: 1,
    authentication_type: [
      ekycAuthenticationType.Identification_Auth,
      ekycAuthenticationType.MNC_Auth,
    ],
    percent: 5,
  },
  // -------2 Personal + 2 Company-------
  {
    reg_category: 1,
    is_iden_c: true,
    numbers_of_personal: 2,
    numbers_of_company: 2,
    authentication_type: [ekycAuthenticationType.Identification_Auth],
    percent: 25,
  },
  {
    reg_category: 1,
    is_iden_c: false,
    numbers_of_personal: 2,
    numbers_of_company: 2,
    authentication_type: [ekycAuthenticationType.Identification_Auth],
    percent: 15,
  },
  {
    reg_category: 1,
    is_iden_c: false,
    numbers_of_personal: 2,
    numbers_of_company: 2,
    authentication_type: [ekycAuthenticationType.MNC_Auth],
    percent: 10,
  },
  // -------3 Personal + 2 Company-------
  {
    reg_category: 1,
    is_iden_c: true,
    numbers_of_personal: 3,
    numbers_of_company: 2,
    authentication_type: [ekycAuthenticationType.Identification_Auth],
    percent: 20,
  },
  {
    reg_category: 1,
    is_iden_c: false,
    numbers_of_personal: 3,
    numbers_of_company: 2,
    authentication_type: [
      ekycAuthenticationType.Identification_Auth,
      ekycAuthenticationType.MNC_Auth,
    ],
    percent: 10,
  },
  // -------4 Personal + 2 Company-------
  {
    reg_category: 1,
    is_iden_c: true,
    numbers_of_personal: 4,
    numbers_of_company: 2,
    authentication_type: [ekycAuthenticationType.Identification_Auth],
    percent: 15,
  },
  {
    reg_category: 1,
    is_iden_c: false,
    numbers_of_personal: 4,
    numbers_of_company: 2,
    authentication_type: [ekycAuthenticationType.Identification_Auth],
    percent: 10,
  },
  {
    reg_category: 1,
    is_iden_c: false,
    numbers_of_personal: 4,
    numbers_of_company: 2,
    authentication_type: [ekycAuthenticationType.MNC_Auth],
    percent: 5,
  },
  // -------5 Personal + 2 Company-------
  {
    reg_category: 1,
    is_iden_c: true,
    numbers_of_personal: 5,
    numbers_of_company: 2,
    authentication_type: [ekycAuthenticationType.Identification_Auth],
    percent: 12,
  },
  {
    reg_category: 1,
    is_iden_c: false,
    numbers_of_personal: 5,
    numbers_of_company: 2,
    authentication_type: [
      ekycAuthenticationType.Identification_Auth,
      ekycAuthenticationType.MNC_Auth,
    ],
    percent: 6,
  },
  // -------6 Personal + 2 Company-------
  {
    reg_category: 1,
    is_iden_c: true,
    numbers_of_personal: 6,
    numbers_of_company: 2,
    authentication_type: [ekycAuthenticationType.Identification_Auth],
    percent: 10,
  },
  {
    reg_category: 1,
    is_iden_c: false,
    numbers_of_personal: 6,
    numbers_of_company: 2,
    authentication_type: [
      ekycAuthenticationType.Identification_Auth,
      ekycAuthenticationType.MNC_Auth,
    ],
    percent: 5,
  },
  // -------3 Personal + 3 Company-------
  {
    reg_category: 1,
    is_iden_c: true,
    numbers_of_personal: 3,
    numbers_of_company: 3,
    authentication_type: [ekycAuthenticationType.Identification_Auth],
    percent: 15,
  },
  {
    reg_category: 1,
    is_iden_c: false,
    numbers_of_personal: 3,
    numbers_of_company: 3,
    authentication_type: [ekycAuthenticationType.Identification_Auth],
    percent: 10,
  },
  {
    reg_category: 1,
    is_iden_c: false,
    numbers_of_personal: 3,
    numbers_of_company: 3,
    authentication_type: [ekycAuthenticationType.MNC_Auth],
    percent: 5,
  },
  // -------4 Personal + 3 Company-------
  {
    reg_category: 1,
    is_iden_c: true,
    numbers_of_personal: 4,
    numbers_of_company: 3,
    authentication_type: [ekycAuthenticationType.Identification_Auth],
    percent: 15,
  },
  {
    reg_category: 1,
    is_iden_c: false,
    numbers_of_personal: 4,
    numbers_of_company: 3,
    authentication_type: [ekycAuthenticationType.Identification_Auth],
    percent: 10,
  },
  {
    reg_category: 1,
    is_iden_c: false,
    numbers_of_personal: 4,
    numbers_of_company: 3,
    authentication_type: [ekycAuthenticationType.MNC_Auth],
    percent: 5,
  },
  // -------5 Personal + 3 Company-------
  {
    reg_category: 1,
    is_iden_c: true,
    numbers_of_personal: 5,
    numbers_of_company: 3,
    authentication_type: [ekycAuthenticationType.Identification_Auth],
    percent: 12,
  },
  {
    reg_category: 1,
    is_iden_c: false,
    numbers_of_personal: 5,
    numbers_of_company: 3,
    authentication_type: [
      ekycAuthenticationType.Identification_Auth,
      ekycAuthenticationType.MNC_Auth,
    ],
    percent: 6,
  },
  // -------6 Personal + 3 Company-------
  {
    reg_category: 1,
    is_iden_c: true,
    numbers_of_personal: 6,
    numbers_of_company: 3,
    authentication_type: [ekycAuthenticationType.Identification_Auth],
    percent: 10,
  },
  {
    reg_category: 1,
    is_iden_c: false,
    numbers_of_personal: 6,
    numbers_of_company: 3,
    authentication_type: [
      ekycAuthenticationType.Identification_Auth,
      ekycAuthenticationType.MNC_Auth,
    ],
    percent: 5,
  },
  // -------4 Personal + 4 Company-------
  {
    reg_category: 1,
    is_iden_c: true,
    numbers_of_personal: 4,
    numbers_of_company: 4,
    authentication_type: [ekycAuthenticationType.Identification_Auth],
    percent: 12,
  },
  {
    reg_category: 1,
    is_iden_c: false,
    numbers_of_personal: 4,
    numbers_of_company: 4,
    authentication_type: [
      ekycAuthenticationType.Identification_Auth,
      ekycAuthenticationType.MNC_Auth,
    ],
    percent: 6,
  },
  // -------5 Personal + 4 Company-------
  {
    reg_category: 1,
    is_iden_c: true,
    numbers_of_personal: 5,
    numbers_of_company: 4,
    authentication_type: [ekycAuthenticationType.Identification_Auth],
    percent: 12,
  },
  {
    reg_category: 1,
    is_iden_c: false,
    numbers_of_personal: 5,
    numbers_of_company: 4,
    authentication_type: [
      ekycAuthenticationType.Identification_Auth,
      ekycAuthenticationType.MNC_Auth,
    ],
    percent: 6,
  },
  // -------6 Personal + 4 Company-------
  {
    reg_category: 1,
    is_iden_c: true,
    numbers_of_personal: 6,
    numbers_of_company: 4,
    authentication_type: [ekycAuthenticationType.Identification_Auth],
    percent: 10,
  },
  {
    reg_category: 1,
    is_iden_c: false,
    numbers_of_personal: 6,
    numbers_of_company: 4,
    authentication_type: [
      ekycAuthenticationType.Identification_Auth,
      ekycAuthenticationType.MNC_Auth,
    ],
    percent: 5,
  },
  // -------5 Personal + 5 Company-------
  {
    reg_category: 1,
    is_iden_c: true,
    numbers_of_personal: 5,
    numbers_of_company: 5,
    authentication_type: [ekycAuthenticationType.Identification_Auth],
    percent: 10,
  },
  {
    reg_category: 1,
    is_iden_c: false,
    numbers_of_personal: 5,
    numbers_of_company: 5,
    authentication_type: [
      ekycAuthenticationType.Identification_Auth,
      ekycAuthenticationType.MNC_Auth,
    ],
    percent: 5,
  },
  // -------6 Personal + 5 Company-------
  {
    reg_category: 1,
    is_iden_c: true,
    numbers_of_personal: 6,
    numbers_of_company: 5,
    authentication_type: [ekycAuthenticationType.Identification_Auth],
    percent: 10,
  },
  {
    reg_category: 1,
    is_iden_c: false,
    numbers_of_personal: 6,
    numbers_of_company: 6,
    authentication_type: [
      ekycAuthenticationType.Identification_Auth,
      ekycAuthenticationType.MNC_Auth,
    ],
    percent: 5,
  },
]

const icpayPersonalPoA = [
  // -------ICPAY Personal-------
  {
    reg_category: 0,
    numbers_of_personal: 1,
    numbers_of_company: 0,
    authentication_type: [
      ekycAuthenticationType.Identification_Auth,
      ekycAuthenticationType.PoA_Auth,
    ],
    percent: 50,
  },

  // -------ICPAY Company-------
  // -------1 Personal + 1 Company-------
  {
    reg_category: 1,
    numbers_of_personal: 1,
    numbers_of_company: 1,
    authentication_type: [
      ekycAuthenticationType.Identification_Auth,
      ekycAuthenticationType.PoA_Auth,
    ],
    percent: 25,
  },
  // -------2 Personal + 1 Company-------
  {
    reg_category: 1,
    numbers_of_personal: 2,
    numbers_of_company: 1,
    authentication_type: [
      ekycAuthenticationType.Identification_Auth,
      ekycAuthenticationType.PoA_Auth,
    ],
    percent: 15,
  },
  // -------3 Personal + 1 Company-------
  {
    reg_category: 1,
    numbers_of_personal: 3,
    numbers_of_company: 1,
    authentication_type: [ekycAuthenticationType.Identification_Auth],
    percent: 15,
  },
  {
    reg_category: 1,
    numbers_of_personal: 3,
    numbers_of_company: 1,
    authentication_type: [ekycAuthenticationType.PoA_Auth],
    percent: 5,
  },
  // -------4 Personal + 1 Company-------
  {
    reg_category: 1,
    numbers_of_personal: 4,
    numbers_of_company: 1,
    authentication_type: [ekycAuthenticationType.Identification_Auth],
    percent: 10,
  },
  {
    reg_category: 1,
    numbers_of_personal: 4,
    numbers_of_company: 1,
    authentication_type: [ekycAuthenticationType.PoA_Auth],
    percent: 5,
  },
  // -------5 Personal + 1 Company-------
  {
    reg_category: 1,
    numbers_of_personal: 5,
    numbers_of_company: 1,
    authentication_type: [
      ekycAuthenticationType.Identification_Auth,
      ekycAuthenticationType.PoA_Auth,
    ],
    percent: 6,
  },
  // -------6 Personal + 1 Company-------
  {
    reg_category: 1,
    numbers_of_personal: 6,
    numbers_of_company: 1,
    authentication_type: [
      ekycAuthenticationType.Identification_Auth,
      ekycAuthenticationType.PoA_Auth,
    ],
    percent: 5,
  },
  // -------2 Personal + 2 Company-------
  {
    reg_category: 1,
    numbers_of_personal: 2,
    numbers_of_company: 2,
    authentication_type: [ekycAuthenticationType.Identification_Auth],
    percent: 15,
  },

  {
    reg_category: 1,
    numbers_of_personal: 2,
    numbers_of_company: 2,
    authentication_type: [ekycAuthenticationType.PoA_Auth],
    percent: 10,
  },
  // -------3 Personal + 2 Company-------
  {
    reg_category: 1,
    numbers_of_personal: 3,
    numbers_of_company: 2,
    authentication_type: [ekycAuthenticationType.Identification_Auth],
    percent: 15,
  },
  {
    reg_category: 1,
    numbers_of_personal: 3,
    numbers_of_company: 2,
    authentication_type: [ekycAuthenticationType.PoA_Auth],
    percent: 5,
  },
  // -------4 Personal + 2 Company-------
  {
    reg_category: 1,
    numbers_of_personal: 4,
    numbers_of_company: 2,
    authentication_type: [ekycAuthenticationType.Identification_Auth],
    percent: 10,
  },
  {
    reg_category: 1,
    numbers_of_personal: 4,
    numbers_of_company: 2,
    authentication_type: [ekycAuthenticationType.PoA_Auth],
    percent: 5,
  },
  // -------5 Personal + 2 Company-------
  {
    reg_category: 1,
    numbers_of_personal: 5,
    numbers_of_company: 2,
    authentication_type: [
      ekycAuthenticationType.Identification_Auth,
      ekycAuthenticationType.PoA_Auth,
    ],
    percent: 6,
  },
  // -------6 Personal + 2 Company-------
  {
    reg_category: 1,
    numbers_of_personal: 6,
    numbers_of_company: 2,
    authentication_type: [
      ekycAuthenticationType.Identification_Auth,
      ekycAuthenticationType.PoA_Auth,
    ],
    percent: 5,
  },
  // -------3 Personal + 3 Company-------
  {
    reg_category: 1,
    numbers_of_personal: 3,
    numbers_of_company: 3,
    authentication_type: [ekycAuthenticationType.Identification_Auth],
    percent: 10,
  },
  {
    reg_category: 1,
    numbers_of_personal: 3,
    numbers_of_company: 3,
    authentication_type: [ekycAuthenticationType.PoA_Auth],
    percent: 5,
  },
  // -------4 Personal + 3 Company-------
  {
    reg_category: 1,
    numbers_of_personal: 4,
    numbers_of_company: 3,
    authentication_type: [ekycAuthenticationType.Identification_Auth],
    percent: 10,
  },
  {
    reg_category: 1,
    numbers_of_personal: 4,
    numbers_of_company: 3,
    authentication_type: [ekycAuthenticationType.PoA_Auth],
    percent: 5,
  },
  // -------5 Personal + 3 Company-------
  {
    reg_category: 1,
    numbers_of_personal: 5,
    numbers_of_company: 3,
    authentication_type: [
      ekycAuthenticationType.Identification_Auth,
      ekycAuthenticationType.PoA_Auth,
    ],
    percent: 6,
  },
  // -------6 Personal + 3 Company-------
  {
    reg_category: 1,
    numbers_of_personal: 6,
    numbers_of_company: 3,
    authentication_type: [
      ekycAuthenticationType.Identification_Auth,
      ekycAuthenticationType.PoA_Auth,
    ],
    percent: 5,
  },
  // -------4 Personal + 4 Company-------
  {
    reg_category: 1,
    numbers_of_personal: 4,
    numbers_of_company: 4,
    authentication_type: [
      ekycAuthenticationType.Identification_Auth,
      ekycAuthenticationType.PoA_Auth,
    ],
    percent: 6,
  },
  // -------5 Personal + 4 Company-------
  {
    reg_category: 1,
    numbers_of_personal: 5,
    numbers_of_company: 4,
    authentication_type: [
      ekycAuthenticationType.Identification_Auth,
      ekycAuthenticationType.PoA_Auth,
    ],
    percent: 6,
  },
  // -------6 Personal + 4 Company-------
  {
    reg_category: 1,
    numbers_of_personal: 6,
    numbers_of_company: 4,
    authentication_type: [
      ekycAuthenticationType.Identification_Auth,
      ekycAuthenticationType.PoA_Auth,
    ],
    percent: 5,
  },
  // -------5 Personal + 5 Company-------
  {
    reg_category: 1,
    numbers_of_personal: 5,
    numbers_of_company: 5,
    authentication_type: [
      ekycAuthenticationType.Identification_Auth,
      ekycAuthenticationType.PoA_Auth,
    ],
    percent: 5,
  },
  // -------6 Personal + 5 Company-------
  {
    reg_category: 1,
    numbers_of_personal: 6,
    numbers_of_company: 5,
    authentication_type: [
      ekycAuthenticationType.Identification_Auth,
      ekycAuthenticationType.PoA_Auth,
    ],
    percent: 5,
  },
]

const myForexPersonal = {
  percent: 100,
}

const fxonCorporate = [
  // 1 corporate
  {
    numbers_of_personal: 1,
    authentication_type: [ekycAuthenticationType.Col_Auth, ekycAuthenticationType.PoO_Auth],
    percent: 20,
  },
  {
    numbers_of_personal: 1,
    authentication_type: [ekycAuthenticationType.SC_Auth],
    percent: 10,
  },
  // 2 corporate
  {
    numbers_of_personal: 2,
    authentication_type: [ekycAuthenticationType.Col_Auth],
    percent: 20,
  },
  {
    numbers_of_personal: 2,
    authentication_type: [ekycAuthenticationType.SC_Auth, ekycAuthenticationType.PoO_Auth],
    percent: 10,
  },
]

const icpayCorporate = [
  // 1 corporate
  {
    numbers_of_personal: [1, 2, 3, 4, 5, 6],
    numbers_of_company: 1,
    authentication_type: [ekycAuthenticationType.Col_Auth],
    percent: 20,
  },
  {
    numbers_of_personal: [1, 2, 3, 4, 5, 6],
    numbers_of_company: 1,
    authentication_type: [ekycAuthenticationType.SC_Auth],
    percent: 10,
  },
  {
    numbers_of_personal: [1],
    numbers_of_company: 1,
    authentication_type: [ekycAuthenticationType.PoO_Auth],
    percent: 20,
  },
  {
    numbers_of_personal: [2, 3, 4, 5, 6],
    numbers_of_company: 1,
    authentication_type: [ekycAuthenticationType.PoO_Auth],
    percent: 10,
  },
  // 2 corporate
  {
    numbers_of_personal: [2, 3, 4, 5, 6],
    numbers_of_company: 2,
    authentication_type: [ekycAuthenticationType.Col_Auth],
    percent: 10,
  },
  {
    numbers_of_personal: [2, 3, 4, 5, 6],
    numbers_of_company: 2,
    authentication_type: [ekycAuthenticationType.SC_Auth],
    percent: 5,
  },
  {
    numbers_of_personal: [2],
    numbers_of_company: 2,
    authentication_type: [ekycAuthenticationType.PoO_Auth],
    percent: 10,
  },
  {
    numbers_of_personal: [3, 4, 5, 6],
    numbers_of_company: 2,
    authentication_type: [ekycAuthenticationType.PoO_Auth],
    percent: 5,
  },
  // 3 corporate
  {
    numbers_of_personal: [3],
    numbers_of_company: 3,
    authentication_type: [ekycAuthenticationType.Col_Auth],
    isThirdCorporate: false,
    percent: 8,
  },
  {
    numbers_of_personal: [4, 5, 6],
    numbers_of_company: 3,
    authentication_type: [ekycAuthenticationType.Col_Auth],
    isThirdCorporate: false,
    percent: 5,
  },
  {
    numbers_of_personal: [3],
    numbers_of_company: 3,
    authentication_type: [ekycAuthenticationType.Col_Auth],
    isThirdCorporate: true,
    percent: 9,
  },
  {
    numbers_of_personal: [4, 5, 6],
    numbers_of_company: 3,
    authentication_type: [ekycAuthenticationType.Col_Auth],
    isThirdCorporate: true,
    percent: 6,
  },
  {
    numbers_of_personal: [3],
    numbers_of_company: 3,
    authentication_type: [ekycAuthenticationType.SC_Auth, ekycAuthenticationType.PoO_Auth],
    isThirdCorporate: false,
    percent: 5,
  },
  {
    numbers_of_personal: [3],
    numbers_of_company: 3,
    authentication_type: [ekycAuthenticationType.SC_Auth, ekycAuthenticationType.PoO_Auth],
    isThirdCorporate: true,
    percent: 5,
  },
  {
    numbers_of_personal: [4, 5, 6],
    numbers_of_company: 3,
    authentication_type: [ekycAuthenticationType.SC_Auth, ekycAuthenticationType.PoO_Auth],
    isThirdCorporate: false,
    percent: 4,
  },
  {
    numbers_of_personal: [4, 5, 6],
    numbers_of_company: 3,
    authentication_type: [ekycAuthenticationType.SC_Auth, ekycAuthenticationType.PoO_Auth],
    isThirdCorporate: true,
    percent: 4,
  },
  // 4 corporate
  {
    numbers_of_personal: [4],
    numbers_of_company: 4,
    authentication_type: [ekycAuthenticationType.SC_Auth],
    percent: 8,
  },
  {
    numbers_of_personal: [5, 6],
    numbers_of_company: 4,
    authentication_type: [ekycAuthenticationType.SC_Auth],
    percent: 5,
  },
  {
    numbers_of_personal: [4, 5, 6],
    numbers_of_company: 4,
    authentication_type: [ekycAuthenticationType.SC_Auth],
    percent: 2,
  },
  {
    numbers_of_personal: [4, 5, 6],
    numbers_of_company: 4,
    authentication_type: [ekycAuthenticationType.PoO_Auth],
    percent: 3,
  },
  // 5 corporate
  {
    numbers_of_personal: [5],
    numbers_of_company: 5,
    authentication_type: [ekycAuthenticationType.Col_Auth],
    percent: 5,
  },
  {
    numbers_of_personal: [6],
    numbers_of_company: 5,
    authentication_type: [ekycAuthenticationType.Col_Auth],
    percent: 4,
  },
  {
    numbers_of_personal: [5, 6],
    numbers_of_company: 5,
    authentication_type: [ekycAuthenticationType.SC_Auth],
    percent: 2,
  },
  {
    numbers_of_personal: [5],
    numbers_of_company: 5,
    authentication_type: [ekycAuthenticationType.PoO_Auth],
    percent: 3,
  },
  {
    numbers_of_personal: [6],
    numbers_of_company: 5,
    authentication_type: [ekycAuthenticationType.PoO_Auth],
    percent: 2,
  },
]

const fxsignupPersonal = [
  // -------FXSignup-XEM-------
  {
    reg_category: 0,
    numbers_of_personal: 1,
    numbers_of_company: 0,
    authentication_type: [
      ekycAuthenticationType.Identification_Auth,
      ekycAuthenticationType.PoA_Auth,
    ],
    percent: 50,
  },
]

module.exports = {
  fxonPersonal,
  icpayPersonalMNC,
  icpayPersonalPoA,
  myForexPersonal,
  fxonCorporate,
  icpayCorporate,
  fxsignupPersonal,
}
