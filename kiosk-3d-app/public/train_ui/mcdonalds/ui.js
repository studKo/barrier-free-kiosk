const STATE = {
    currentCategory: 'burger',
    currentFilter: 'all',
    cartItems: [],
    tempSelectedItem: null,
    tempSetSelections: { side: null, drink: null },
    isEditing: false,
    diningMethod: null
};

const sidebarTabs = [
    { id: 'burger', name: '🍔 버거' },
    { id: 'happysnack', name: '🍟 해피스낵' },
    { id: 'side', name: '🍟 사이드' },
    { id: 'coffee', name: '☕ 커피' },
    { id: 'dessert', name: '🍦 디저트' },
    { id: 'drink', name: '🥤 음료' }
];

const setSideOptions = [
    { name: "후렌치 후라이 - 미디엄", price: 0, cal: "332 Kcal", img: "https://www.mcdonalds.co.kr/upload/2025/08/%ED%9B%84%EB%A0%8C%EC%B9%98_%ED%9B%84%EB%9D%BC%EC%9D%B4_Medium.png" },
    { name: "후렌치 후라이 - 라지", price: 700, cal: "389 Kcal", img: "https://www.mcdonalds.co.kr/upload/2025/08/%ED%9B%84%EB%A0%8C%EC%B9%98_%ED%9B%84%EB%9D%BC%EC%9D%B4_Large.png" },
    { name: "골든 모짜렐라 치즈스틱 2조각", price: 500, cal: "158 Kcal", img: "https://www.mcdonalds.co.kr/uploadFolder/product/prov_201902080435496530.png" },
    { name: "코울슬로", price: 0, cal: "179 Kcal", img: "https://www.mcdonalds.co.kr/upload/product/pcfile/1680761626050.png" },
    { name: "맥너겟® 4조각", price: 0, cal: "171 Kcal", img: "https://www.mcdonalds.co.kr/upload/product/pcfile/1612402131024.png" }
];

const setDrinkOptions = [
    { name: "코카-콜라 제로 - 미디엄", price: 0, cal: "0 Kcal", img: "https://www.mcdonalds.co.kr/upload/product/pcfile/1583890021601.png" },
    { name: "코카-콜라 - 미디엄", price: 0, cal: "143 Kcal", img: "https://www.mcdonalds.co.kr/upload/product/pcfile/1583889967380.png" },
    { name: "스프라이트 - 미디엄", price: 0, cal: "149 Kcal", img: "https://www.mcdonalds.co.kr/upload/product/pcfile/1703512982605.png" },
    { name: "환타 - 미디엄", price: 0, cal: "113 Kcal", img: "https://www.mcdonalds.co.kr/upload/product/pcfile/1631160688795.png" },
    { name: "바닐라 쉐이크 - 미디엄", price: 1200, cal: "338 Kcal", img: "https://www.mcdonalds.co.kr/uploadFolder/product/prov_201901290255488970.png" }
];

const menuData = {
    recommend: [
        { name: "빅맥® 세트", price: 7500, img: "https://www.mcdonalds.co.kr/upload/2025/08/%EB%B9%85%EB%A7%A5%C2%AE_%EC%84%B8%ED%8A%B8.png" },
        { name: "맥스파이시 상하이 버거 세트", price: 7500, img: "https://www.mcdonalds.co.kr/upload/product/pcfile/1723562660091.png" },
        { name: "1955 버거 세트", price: 8400, img: "https://www.mcdonalds.co.kr/upload/product/pcfile/1723564262197.png" },
        { name: "슈슈 버거 세트", price: 6700, img: "https://www.mcdonalds.co.kr/upload/product/pcfile/1723563590522.png" }
    ],
    burger: [
        { name: "빅맥®", price: 5500, type: "beef", img: "https://i.namu.wiki/i/8QvXSR26KtopPgetehJXwlRCeXoE1fVZowrD7qQHLE6NE4jw3GSGJfRRkBvlwJtZaZ-jSybHFP3N2XiE2X_OWul7tV6lEsQ80zpl0Nv3BTXThz5BSkXLvMQCpjOc-nhUTCaj8-IW6-_nGjDrTc-mWg.webp", setImg: "https://www.mcdonalds.co.kr/upload/2025/08/%EB%B9%85%EB%A7%A5%C2%AE_%EC%84%B8%ED%8A%B8.png" },
        { name: "1955 버거", price: 6400, type: "beef", img: "https://i.namu.wiki/i/5Pcfn8E2KZ2PKxvWzIEht6oEAmkMPVRcp35XVMABbUsKM3Mw2FD_gBs6nlVZmKVT1ax0Zr_vnyJMpVZq5iS0fhljvS54iIQL8HBCY0IHWZwlq2c6uKQNbAveDnhy4gMYFoe3A6ujDHNkI5LSml6ZMw.webp", setImg: "https://www.mcdonalds.co.kr/upload/product/pcfile/1723564262197.png" },
        { name: "베이컨 토마토 디럭스", price: 5800, type: "beef", img: "https://i.namu.wiki/i/mLoN0grnL8zD-4lY2WN-v6HqNME-8YBXBFFmzCDFtY-umdNq-kGtuW4RmpR_pM2ACb5ckXIZ50lUsTVyxaMsPyVBU2-l2WEaWfSkYKOcFGx9n-N-YCtWMaMc2HXh9DUExM4Kh1OivC7hO_pCKNUrdg.webp", setImg: "https://www.mcdonalds.co.kr/upload/product/pcfile/1723563896442.png" },
        { name: "더블 쿼터파운더 치즈", price: 7400, type: "beef", img: "https://i.namu.wiki/i/HIxgWskMC7XbZbk8UMvXvXc1htDTnAQePoF-2855YOlgLHBTpolnmHI2CaVJ9YZqkzG5ZpSXx8-8GTKj8mu6C9PX4Z7k9Cy_ozJqWntqSfKwMCGpV-bKPw7ImvTyKNay_8gpBK_XV0VZMOSl-2iGwQ.webp", setImg: "https://www.mcdonalds.co.kr/upload/product/pcfile/1723563759418.png" },
        { name: "쿼터파운더 치즈", price: 5500, type: "beef", img: "https://i.namu.wiki/i/LZ1z5XiC7WAatqYmn5HD-IMKt2taz2xEK3IlPbk-gn_Nxhtk3yynqv3TZhTH48uIRYBb-PBOSoKdToocVeThpPAsw9SfZ33hJ5ktoxJckMbIhKODWjjtusGKGUCpZWkWgTJbGMovxw3OXb2vnVUe2Q.webp", setImg: "https://www.mcdonalds.co.kr/upload/product/pcfile/1723563812629.png" },
        { name: "토마토 치즈 비프 버거", price: 4900, type: "beef", img: "https://i.namu.wiki/i/-3EptIZiicV_dYwB0sahOLUaLpEFLH8p6KgspU5D9xlYVAU5yg-zW9i8VUaNzwqvblKZGhILQO-2wB0LR2aFwaLxnrZ3em5m4lXfo-ELTqRwLPl3IzUpRkGytWvh2pPVEbKXHrONqxw0i55-BzrHzA.webp", setImg: "https://www.mcdonalds.co.kr/upload/product/pcfile/1742426716721.png" },
        { name: "트리플 치즈 버거", price: 7000, type: "beef", img: "https://i.namu.wiki/i/SWGB57NBjxmVN-TApTYiLrduzGk3HfnUmju0RMJK6SZEAs3zo6aeZ--qj3JK7kspkRKD10BG0ynDvBycHYHiYCEoypW0cQvy0mTHJG29zZmVqyJhMt0n2OdlmJlladR9C8TN9WBqbbYYVz0nQNknBA.webp", setImg: "https://www.mcdonalds.co.kr/upload/product/pcfile/1744956010637.png" },
        { name: "더블 치즈 버거", price: 5900, type: "beef", img: "https://i.namu.wiki/i/l-rku9sp_jN-E7M249zVIKabVTa6HE8iUUWJ909PjMjXFCV5mXv6YzuVuKE6syrUriWkknKjqRLe0SY--NxtAQg3ha7p1oI-w7Cc4ifJX0pIu1nTnBTDY2DjDMGBd3itWoX013jRwLFns7Lx844jnw.webp", setImg: "https://www.mcdonalds.co.kr/upload/product/pcfile/1723563512104.png" },
        { name: "치즈 버거", price: 4100, type: "beef", img: "https://i.namu.wiki/i/9sU-9EviTzMN8uIkVkUqj_YbuJ-Zf1NE6RIR1oJrU-Ii3iJEomW23HraTf1vBIN6XwUGSlPpu1Z9mnvZXzmIQINyIe0Z7H9DhcjdB0o30IZuadKlwxypTEzlhydzZdFEuH2zuK4iw-nK0kCKT5Yt2A.webp", setImg: "https://www.mcdonalds.co.kr/upload/product/pcfile/1723563067813.png" },
        { name: "햄버거", price: 3700, type: "beef", img: "https://www.mcdonalds.co.kr/upload/2025/08/%ED%96%84%EB%B2%84%EA%B1%B0.png" },
        { name: "더블 맥스파이시 상하이 버거", price: 9300, type: "chicken", img: "https://i.namu.wiki/i/dcFQOMDgk8uHmH2CQnnL1aTSnag9MjW_y3QPBAlZo9UkBf0w5ZMwpksfJaWYvTZSGF2P66WPrYA8fHYP8C4Kmh2jzXxmIjeZcZMbBnq627KHBk0TwUcQRusxAdkfvkdgnFfHZjEbNHVCulksdRvHCg.webp", setImg: "https://www.mcdonalds.co.kr/upload/2026/02/Corp_PC_VIEW_772x530_%EB%8D%94%EB%B8%94%EC%83%81%ED%95%98%EC%9D%B4_EVM.png" },
        { name: "맥스파이시 상하이 버거", price: 5500, type: "chicken", img: "https://i.namu.wiki/i/IaTLtN71kkGV3JR3o-reXdMEX2jOjjmyueKXhgMrJ6JmxfL_b3iAeSxi7spI4YJrkYzPZqqXRHg9Bpfa898hW46vU2vhFE9UJ3NyO6pqiuvjYOPb-bbty_DIQ-vQVIhA8uH5rvEz-vQOlIbs7eDJlA.webp", setImg: "https://www.mcdonalds.co.kr/upload/product/pcfile/1723562660091.png" },
        { name: "맥크리스피 치킨 디럭스", price: 6800, type: "chicken", img: "https://i.namu.wiki/i/sqeV27P9gJ5lbkscZoYXVDjPo2ZkjiVhEXfsWlyDonWNqysgvsWRylFPx3vnOxCZhgtQJLrixK8rqsPLT0i03wN_a8ybIbzEJtpNiYmMkOv6aEktaqOvHIImGDZSea1XYbH63P-vHtWNtIKyCI_qMQ.webp", setImg: "https://www.mcdonalds.co.kr/upload/2026/02/Corp_PC_VIEW_%EB%A7%A5%ED%81%AC%EB%A6%AC%ED%94%BC_%EC%B9%98%ED%82%A8_%EB%94%94%EB%9F%AD%EC%8A%A4_772x530_new.png" },
        { name: "맥크리스피 치킨 클래식", price: 5900, type: "chicken", img: "https://i.namu.wiki/i/fnBdh8UzymJ2ILDkw5dgkbZ-kiabW6ucjsytnCYy_r7PLhFQ-cH7WIZWPtrb4XnCKDw02QqTA-nkBQIoavp6AnfB1ALNpEN2fD3tQanV9uS0NEGklQPTo3IF1GIBmfH5fA3_lEFFlpQZuCGolyR8LA.webp", setImg: "https://www.mcdonalds.co.kr/upload/2026/02/Corp_PC_VIEW_%EB%A7%A5%ED%81%AC%EB%A6%AC%ED%94%BC_%EC%B9%98%ED%82%A8_%ED%81%B4%EB%9E%98%EC%8B%9D_772x530_new.png" },
        { name: "맥치킨 모짜렐라", price: 5000, type: "chicken", img: "https://i.namu.wiki/i/QrYxfF_3zkArfAaOGBn8iz7rjQ1QcOHyqKrNPJYAvvr-zUSLNBfe6DZCGx1sbVHbQxNf1xI2BMy8ATcN5BQ4dPY6LQE5EsY6LBOqOgFFDCvAdUN1togyChsVik-_bbs_cYFP3x_QMOz9nS0qCa-rEQ.webp", setImg: "https://www.mcdonalds.co.kr/upload/product/pcfile/1723563301214.png" },
        { name: "맥치킨", price: 3500, type: "chicken", img: "https://i.namu.wiki/i/Wmb5_Q7CYZ_RbfU7bM9EGVmszC9oFUtw4urGZzRkqVVf9JBpK3MfpCBmsZMrn1b7bH5epDobXzZNDoEvyXR9J3J5cer3gZ-Z_5V-JYoTTyvK_m_j8M5jlPq9JADB3t2MiCqqJiR0ridfOssfUpBIww.webp", setImg: "https://www.mcdonalds.co.kr/upload/product/pcfile/1723563415066.png" },
        { name: "슈슈 버거", price: 4700, type: "seafood", img: "https://i.namu.wiki/i/LWiNEqDMbtPp7eNpv_jvgOtLrFAhYNZwNiSbAvc33T18GH6uZXHzXGMgfiCdzgSB9PruAcCldJF37_9pf6muTKxjSgwZTCNmsedZDvflM7FkdKxiSWNlJU-Odlxpi5Yp6vXredUswCeTtL6GUMIUPw.webp", setImg: "https://www.mcdonalds.co.kr/upload/product/pcfile/1723563590522.png" },
        { name: "슈비 버거", price: 5800, type: "seafood", img: "https://i.namu.wiki/i/DSkf47N_MzutvlaAB5BBno5xtoKVvmitytf5ZSVRWWLXt-rC_FmuMvvmGHObc2WOtGkUMnH_kLLsmX4JTH6FDeRSMhGpPm4uuldpzmdnmmAmh8t5eiYF5Nf_BNYTTAZOE_qoGRqe-RKQIzXarL-0BA.webp", setImg: "https://www.mcdonalds.co.kr/upload/product/pcfile/1723564188909.png" },
        { name: "더블 불고기 버거", price: 4500, type: "bulgogi", img: "https://i.namu.wiki/i/h2DgS1WCkyi3F40ge5lriDf7ZiSyorAY3ae4wq7l3Yi_FfFoJ0zNmv9HK_PmYq-2oahys6vdHGuE2jGSb_eRYXbpBPExnsud2E2o_R7VIq4QPpfZKP_tCX6dH3EMdoeL6APTXk-gyVz-wWg2YnS9gg.webp", setImg: "https://www.mcdonalds.co.kr/upload/product/pcfile/1723563975095.png" },
        { name: "불고기 버거", price: 3500, type: "bulgogi", img: "https://i.namu.wiki/i/wLV6rT_qFlkPlUQXF3Xutlw9PDRsjG6HR0nrdCLONNcd76EUQxwrsJvWlZduy_WPnzwuaiYih6q6LVy-tP-qmMjqKc3TJvFmhs_dkMuoiQZ5s293GwHrWbB8YkcRBKL-F5vbkBW8SOLU1pZiz2XnAA.webp", setImg: "https://www.mcdonalds.co.kr/upload/product/pcfile/1723564031536.png" }
    ],
    happysnack: [
        { name: "아이스 드립 커피 Medium", price: 1500, type: "drink", img: "https://www.mcdonalds.co.kr/upload/product/pcfile/1708663234209.png" },
        { name: "아이스 드립커피 Large", price: 2000, type: "drink", img: "https://www.mcdonalds.co.kr/upload/product/pcfile/1753862426041.png" },
        { name: "바닐라 쉐이크 Medium", price: 2500, type: "drink", img: "https://www.mcdonalds.co.kr/upload/product/pcfile/1651228037031.png" },
        { name: "맥너겟 4조각", price: 2000, type: "snack", img: "https://www.mcdonalds.co.kr/upload/product/pcfile/1715674478138.png" },
        { name: "한입 초코 츄러스 3조각", price: 2500, type: "snack", img: "https://www.mcdonalds.co.kr/upload/product/pcfile/1736299008239.png" }
    ],
    side: [
        { name: "후렌치 후라이(L)", price: 2700, type: "fries", img: "https://www.mcdonalds.co.kr/upload/2025/08/%ED%9B%84%EB%A0%8C%EC%B9%98_%ED%9B%84%EB%9D%BC%EC%9D%B4_Large.png" },
        { name: "후렌치 후라이(M)", price: 2000, type: "fries", img: "https://www.mcdonalds.co.kr/upload/2025/08/%ED%9B%84%EB%A0%8C%EC%B9%98_%ED%9B%84%EB%9D%BC%EC%9D%B4_Medium.png" },
        { name: "맥너겟® 6조각", price: 5000, type: "chicken", img: "https://www.mcdonalds.co.kr/upload/2025/08/%EB%A7%A5%EB%84%88%EA%B2%9F%C2%AE6%EC%A1%B0%EA%B0%81.png" },
        { name: "맥너겟® 4조각", price: 3700, type: "chicken", img: "https://www.mcdonalds.co.kr/upload/product/pcfile/1612402131024.png" },
        { name: "골든 모짜렐라 치즈스틱 2조각", price: 2500, type: "cheese", img: "https://www.mcdonalds.co.kr/uploadFolder/product/prov_201902080435496530.png" },
        { name: "코울슬로", price: 1900, type: "other", img: "https://www.mcdonalds.co.kr/upload/product/pcfile/1680761626050.png" }
    ],
    coffee: [
        { name: "아이스 아메리카노", price: 2700, type: "iced", img: "https://www.mcdonalds.co.kr/upload/product/pcfile/1610887631017.png" },
        { name: "아이스 드립 커피M", price: 2400, type: "iced", img: "https://www.mcdonalds.co.kr/upload/product/pcfile/1610889861261.png" },
        { name: "아이스 드립 커피L", price: 2800, type: "iced", img: "https://www.mcdonalds.co.kr/upload/2025/08/%EC%95%84%EC%9D%B4%EC%8A%A4_%EB%93%9C%EB%A6%BD_%EC%BB%A4%ED%94%BC_Large.png" },
        { name: "아이스 카페라떼", price: 3400, type: "iced", img: "https://www.mcdonalds.co.kr/upload/product/pcfile/1610885477469.png" },
        { name: "아이스 바닐라 라떼", price: 3900, type: "iced", img: "https://www.mcdonalds.co.kr/upload/product/pcfile/1654652269651.png" },
        { name: "카페라떼", price: 3400, type: "hot", img: "https://www.mcdonalds.co.kr/upload/product/pcfile/1677680118201.png" },
        { name: "바닐라 라떼", price: 3900, type: "hot", img: "https://www.mcdonalds.co.kr/upload/product/pcfile/1677678794782.png" },
        { name: "카푸치노", price: 3400, type: "hot", img: "https://www.mcdonalds.co.kr/upload/product/pcfile/1677679951061.png" },
        { name: "드립 커피", price: 2400, type: "hot", img: "https://www.mcdonalds.co.kr/upload/product/pcfile/1677680459621.png" },
        { name: "디카페인 아메리카노", price: 2900, type: "decaf", img: "https://www.mcdonalds.co.kr/upload/product/pcfile/1677679725954.png" },
        { name: "디카페인 아이스 아메리카노", price: 2900, type: "decaf", img: "https://www.mcdonalds.co.kr/upload/product/pcfile/1610889486625.png" },
        { name: "디카페인 카페라떼", price: 3600, type: "decaf", img: "https://www.mcdonalds.co.kr/upload/product/pcfile/1677679216326.png" },
        { name: "디카페인 아이스 카페라떼", price: 3600, type: "decaf", img: "https://www.mcdonalds.co.kr/upload/product/pcfile/1610887233610.png" },
        { name: "디카페인 바닐라 라떼", price: 4100, type: "decaf", img: "https://www.mcdonalds.co.kr/upload/2026/02/Corp_PC_VIEW_772x530_%EB%94%94%EC%B9%B4%ED%8E%98%EC%9D%B8_%EB%B0%94%EB%8B%90%EB%9D%BC%EB%9D%BC%EB%97%B4_M.png" },
        { name: "디카페인 아이스 바닐라 라떼", price: 4100, type: "decaf", img: "https://www.mcdonalds.co.kr/upload/2026/02/Corp_PC_VIEW_772x530_%EB%B0%94%EB%8B%90%EB%9D%BC%EB%9D%BC%EB%96%BC_%EB%94%94%EC%B9%B4%ED%8E%98_M.png" },
        { name: "디카페인 카푸치노", price: 3600, type: "decaf", img: "https://www.mcdonalds.co.kr/upload/product/pcfile/1677679486199.png" }
    ],            
    dessert: [
        { name: "스트로베리콘", price: 3000, type: "icecream", img: "https://www.mcdonalds.co.kr/upload/2026/02/Corp_PC_VIEW_772x530_%EC%8A%A4%ED%8A%B8%EB%A1%9C%EB%B2%A0%EB%A6%AC%EC%BD%98.png" },
        { name: "아이스크림콘", price: 3000, type: "icecream", img: "https://www.mcdonalds.co.kr/upload/2026/02/Corp_PC_VIEW_772x530_%EC%95%84%EC%9D%B4%EC%8A%A4%ED%81%AC%EB%A6%BC%EC%BD%98.png" },
        { name: "초코 선데이 아이스크림", price: 3000, type: "icecream", img: "https://www.mcdonalds.co.kr/uploadFolder/product/prov_201901290248295110.png" },
        { name: "딸기 선데이 아이스크림", price: 3000, type: "icecream", img: "https://www.mcdonalds.co.kr/uploadFolder/product/prov_201901290248522410.png" },
        { name: "바닐라 선데이 아이스크림", price: 3000, type: "icecream", img: "https://www.mcdonalds.co.kr/upload/product/pcfile/1657246845162.png" },
        { name: "오레오 맥플러리", price: 3000, type: "mcflurry", img: "https://www.mcdonalds.co.kr/upload/product/pcfile/1615378578396.png" },
        { name: "딸기 오레오 맥플러리", price: 3000, type: "mcflurry", img: "https://www.mcdonalds.co.kr/upload/product/pcfile/1615378509519.png" },
        { name: "초코 오레오 맥플러리", price: 3000, type: "mcflurry", img: "https://www.mcdonalds.co.kr/upload/product/pcfile/1615378451271.png" },
        { name: "베리 스트로베리 맥플러리", price: 3000, type: "mcflurry", img: "https://www.mcdonalds.co.kr/upload/product/pcfile/1617837982953.png" },
        { name: "한입 초코 츄러스 3조각", price: 2500, type: "other", img: "https://www.mcdonalds.co.kr/upload/2026/01/Corp_PC_VIEW_772x530_%EC%B4%88%EC%BD%94%EC%B8%84%EB%9F%AC%EC%8A%A4.png" }
    ],
    drink: [
        { name: "코카 콜라 제로", price: 2000, type: "soda", img: "https://www.mcdonalds.co.kr/upload/product/pcfile/1583890021601.png" },
        { name: "코카 콜라", price: 2000, type: "soda", img: "https://www.mcdonalds.co.kr/upload/product/pcfile/1583889967380.png" },
        { name: "스프라이트", price: 2000, type: "soda", img: "https://www.mcdonalds.co.kr/upload/product/pcfile/1703512982605.png" },
        { name: "환타", price: 2000, type: "soda", img: "https://www.mcdonalds.co.kr/upload/product/pcfile/1631160688795.png" },
        { name: "바닐라 쉐이크", price: 2800, type: "shake", img: "https://www.mcdonalds.co.kr/uploadFolder/product/prov_201901290255488970.png" },
        { name: "딸기 쉐이크", price: 2800, type: "shake", img: "https://www.mcdonalds.co.kr/uploadFolder/product/prov_201901290257347040.png" },
        { name: "초코 쉐이크", price: 2800, type: "shake", img: "https://www.mcdonalds.co.kr/uploadFolder/product/prov_201901290257444650.png" },
        { name: "망고 피치 아이스티", price: 3400, type: "tea", img: "https://www.mcdonalds.co.kr/upload/product/pcfile/1742516397001.png" },
        { name: "피치 아이스티", price: 3100, type: "tea", img: "https://www.mcdonalds.co.kr/upload/product/pcfile/1742516130042.png" },
        { name: "생수", price: 1300, type: "water", img: "https://www.mcdonalds.co.kr/uploadFolder/product/prov_201901290258201760.png" }
    ]
};
const categoryFilters = { burger: [{ id: 'all', name: '전체' }, { id: 'beef', name: '비프' }, { id: 'chicken', name: '치킨' }, { id: 'bulgogi', name: '불고기' }, { id: 'seafood', name: '씨푸드' }] };
const titleMap = { 'recommend': '추천메뉴', 'burger': '버거', 'happysnack': '해피스낵', 'side': '사이드', 'coffee': '커피', 'dessert': '디저트', 'drink': '음료' };

function initApp() {
    renderStartScreen();
}

// 1. 첫 화면 그리기
function renderStartScreen() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div id="start-screen">
            <div class="start-title">식사 방법을<br>선택해 주세요</div>
            <div class="start-options">
                <div class="start-card" onclick="selectDiningMethod('eat-in')">
                    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="width:160px; height:160px; margin-bottom:30px;">
                        <circle cx="30" cy="35" r="7" fill="#D0D0D0"/>
                        <path d="M 22 65 L 22 50 C 22 42, 38 42, 38 50 L 38 65 Z" fill="#D0D0D0"/>
                        <path d="M 32 52 L 44 52 L 44 42" fill="none" stroke="#D0D0D0" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
                        <rect x="40" y="65" width="40" height="4" fill="#D0D0D0"/>
                        <rect x="48" y="69" width="4" height="21" fill="#D0D0D0"/>
                        <rect x="68" y="69" width="4" height="21" fill="#D0D0D0"/>
                        <path d="M 22 45 L 22 65" fill="none" stroke="#FFC72C" stroke-width="4" stroke-linecap="round"/>
                        <rect x="18" y="65" width="20" height="4" fill="#FFC72C"/>
                        <rect x="20" y="69" width="4" height="21" fill="#FFC72C"/>
                        <rect x="32" y="69" width="4" height="21" fill="#FFC72C"/>
                        <path d="M 98 45 L 98 65" fill="none" stroke="#FFC72C" stroke-width="4" stroke-linecap="round"/>
                        <rect x="82" y="65" width="20" height="4" fill="#FFC72C"/>
                        <rect x="84" y="69" width="4" height="21" fill="#FFC72C"/>
                        <rect x="96" y="69" width="4" height="21" fill="#FFC72C"/>
                        <path d="M 68 60 C 68 53, 82 53, 82 60" fill="#C28A54"/>
                        <rect x="68" y="61" width="14" height="2" fill="#DA291C"/>
                        <rect x="68" y="63" width="14" height="2" fill="#FFC72C"/>
                        <path d="M 54 52 L 52 42 M 57 52 L 55 40 M 60 52 L 61 41 M 63 52 L 65 43" stroke="#FFC72C" stroke-width="2.5" stroke-linecap="round"/>
                        <path d="M 50 50 L 66 50 L 63 65 L 53 65 Z" fill="#DA291C"/>
                    </svg>
                    <span>매장에서 식사</span>
                </div>
                <div class="start-card" onclick="selectDiningMethod('take-out')">
                    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="width:160px; height:160px; margin-bottom:30px;">
                        <path d="M 20 30 L 25 22 L 30 30 L 35 22 L 40 30 L 45 22 L 50 30 L 55 22 L 60 30 L 65 22 L 70 30 L 75 22 L 80 30 Z" fill="#C28A54"/>
                        <path d="M 20 30 L 80 30 L 76 90 L 24 90 Z" fill="#C28A54"/>
                        <path d="M 24.5 70 L 75.5 70 L 76 90 L 24 90 Z" fill="#DA291C"/>
                        <path d="M 32 80 L 32 50 C 32 38, 50 38, 50 60 C 50 38, 68 38, 68 50 L 68 80" fill="none" stroke="#FFC72C" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span>테이크 아웃</span>
                </div>
            </div>
        </div>
    `;
}

// 2. 식사 방법 선택 시 메인 화면으로 넘어가는 함수
function selectDiningMethod(method) {
    STATE.diningMethod = method; // 'eat-in' 이나 'take-out' 저장
    startMainKiosk();
}

// 3. 기존 initApp() 역할을 하는 메인 키오스크 실행 함수
function startMainKiosk() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="kiosk-screen">
            <div class="k-top">
                <div class="k-sidebar" id="sidebar-container"></div>
                <div class="k-content">
                    <div class="k-header" id="header-container"></div>
                    <div class="k-scroll-wrap">
                        <div class="k-grid" id="k-grid"></div>
                    </div>
                </div>
            </div>
            <div class="k-scrollbar" id="k-scrollbar">
                <div class="k-arrow" onclick="scrollKiosk('up')">∧</div>
                <div class="k-track" id="k-track"><div class="k-thumb" id="k-thumb"></div></div>
                <div class="k-arrow" onclick="scrollKiosk('down')">∨</div>
            </div>
            <div class="k-bottom" id="bottom-container"></div>
            <div id="set-modal-container"></div>
            <div class="modal-overlay" id="process-modal"></div> 
            <div id="cart-modal-container"></div>
        </div>
    `;
    
    renderSidebar(); renderHeader(); renderGrid(); renderBottom(); renderModals(); 
    const kGrid = document.getElementById('k-grid');
    kGrid.addEventListener('scroll', updateScrollbar);
    initDragScroll(kGrid);
    initThumbDrag();
}

function renderSidebar() {
    const container = document.getElementById('sidebar-container');
    let tabsHtml = `
        <div class="k-menu-group" id="category-tabs-top">
            <div class="k-menu-item" style="justify-content:center; height:auto; padding: 25px 0;">
                <img src="https://i.namu.wiki/i/pYdtlj-fQNTInL7V6QVzRNAB_9Ip74fCiowUbuIEb03dzfy9olYTgA6-SLOD4GRe-Uub5_zWT-hocLHOcJDBxw.svg" alt="맥도날드 로고" style="width: 60px; height: auto;">
            </div>
            <div class="k-menu-item" onclick="location.reload()">🏠 홈</div>
            <div class="k-menu-item ${STATE.currentCategory === 'recommend' ? 'active' : ''}" onclick="changeCategory('recommend')">⭐ 추천메뉴</div>
        </div>
        <div class="k-menu-group" style="margin-top: 12px;">
    `;
    sidebarTabs.forEach(tab => {
        const isActive = STATE.currentCategory === tab.id ? 'active' : '';
        tabsHtml += `<div class="k-menu-item ${isActive}" onclick="changeCategory('${tab.id}')">${tab.name}</div>`;
    });
    tabsHtml += `</div>`;
    container.innerHTML = tabsHtml;
}

function renderHeader() {
    const container = document.getElementById('header-container');
    const title = titleMap[STATE.currentCategory] || '';
    const filters = categoryFilters[STATE.currentCategory];
    let filterHtml = '';
    if (filters) {
        filterHtml = `<div class="k-filters">`;
        filters.forEach(f => {
            const isActive = STATE.currentFilter === f.id ? 'active' : '';
            filterHtml += `<button class="k-filter-btn ${isActive}" onclick="filterSubCategory('${f.id}')">${f.name}</button>`;
        });
        filterHtml += `</div>`;
    }
    container.innerHTML = `<div class="k-title">${title}</div><div class="k-subtitle" style="display: ${filters ? 'block' : 'none'}">아래에서 세부메뉴를 확인하세요</div>${filterHtml}`;
}

function renderGrid() {
    const grid = document.getElementById('k-grid');
    let items = menuData[STATE.currentCategory] || [];
    if (STATE.currentFilter !== 'all') items = items.filter(item => item.type === STATE.currentFilter);

    let gridHtml = '';
    items.forEach((item) => {
        const setImgData = item.setImg ? item.setImg : '';
        gridHtml += `
            <div class="k-card" onclick="handleItemClick('${item.name}', ${item.price}, '${item.img}', '${STATE.currentCategory}', '${setImgData}')">
                <img class="k-img" src="${item.img}" alt="${item.name}">
                <div class="k-name">${item.name}</div>
                <div class="k-price-wrap"><div class="k-price">₩${item.price.toLocaleString()}</div></div>
            </div>
        `;
    });
    grid.innerHTML = gridHtml; grid.scrollTop = 0; setTimeout(updateScrollbar, 10);
}

function renderBottom() {
    const container = document.getElementById('bottom-container');
    let totalQty = 0; let totalPrice = 0;
    STATE.cartItems.forEach(item => { totalQty += item.qty; totalPrice += (item.price * item.qty); });
    const btnClass = totalQty > 0 ? 'k-checkout active' : 'k-checkout';

    container.innerHTML = `
        <div class="k-bottom-qr"><div class="qr-text">포인트를 적립하세요<br>결제 전 선택 필수</div></div>
        <div class="k-bottom-center">
            <div class="cart-price-row">
                <div class="cart-icon-wrap">🛍️<div class="cart-badge" id="k-count">${totalQty}</div></div>
                <div class="k-total">₩ <span>${totalPrice.toLocaleString()}</span></div>
            </div>
            <div class="action-btn-row"><button class="action-btn" onclick="resetCartConfirm()">처음으로</button></div>
            <div class="calorie-notice">일일 영양성분 기준치는 2,000kcal로서 개인의 필요 열량에 따라 다를 수 있습니다.</div>
        </div>
        <div class="k-bottom-right"><button class="${btnClass}" onclick="openCartModal()">주문내역 확인/결제하기</button></div>
    `;
}

function renderModals() {
    document.getElementById('set-modal-container').innerHTML = `
        <div class="modal-overlay" id="set-modal">
            <div class="modal-box">
                <div class="modal-title" id="modal-item-name"></div>
                <div class="modal-subtitle">세트로 주문하시겠습니까?</div>
                <div class="option-container">
                    <div class="option-card" onclick="selectOption('단품')">
                        <img class="option-img" id="modal-single-img" src="" alt="단품">
                        <div class="option-name">단품 선택</div>
                        <div class="option-price" id="modal-single-price"></div>
                    </div>
                    <div class="option-card" onclick="selectOption('세트')">
                        <img class="option-img" id="modal-set-img" src="" alt="세트">
                        <div class="option-name">세트 선택</div>
                        <div class="option-price" id="modal-set-price"></div>
                    </div>
                </div>
                <button class="modal-cancel-btn" onclick="closeSetModal()">취소 (뒤로가기)</button>
            </div>
        </div>
    `;
    document.getElementById('cart-modal-container').innerHTML = `
        <div class="modal-overlay" id="cart-modal">
            <div class="modal-box" id="cart-modal-inner"></div>
        </div>
    `;
}

function changeCategory(categoryKey) { STATE.currentCategory = categoryKey; STATE.currentFilter = 'all'; renderSidebar(); renderHeader(); renderGrid(); initDragScroll(document.getElementById('k-grid')); }
function filterSubCategory(type) { STATE.currentFilter = type; renderHeader(); renderGrid(); }

function handleItemClick(name, price, img, category, setImg) {
    if (category === 'burger' && !name.includes('세트')) {
        STATE.tempSelectedItem = { name, price, img, setImg: setImg ? setImg : "사진/기본_세트.png" };
        document.getElementById('modal-item-name').innerText = name;
        document.getElementById('modal-single-img').src = img;
        document.getElementById('modal-set-img').src = STATE.tempSelectedItem.setImg;
        document.getElementById('modal-single-price').innerText = '₩' + price.toLocaleString();
        document.getElementById('modal-set-price').innerText = '₩' + (price + 2000).toLocaleString(); 
        document.getElementById('set-modal').style.display = 'flex';
    } else {
        addToCart({ name: name, price: price, img: img });
    }
}

function selectOption(optionType) {
    if (optionType === '세트') { openProcessStep(1); } 
    else { addToCart({ name: STATE.tempSelectedItem.name, price: STATE.tempSelectedItem.price, img: STATE.tempSelectedItem.img }); closeSetModal(); }
}

function closeSetModal() { document.getElementById('set-modal').style.display = 'none'; }

function closeProcessModal() { 
    document.getElementById('process-modal').style.display = 'none'; 
    STATE.tempSetSelections = { side: null, drink: null }; 
    STATE.isEditing = false;
}

function goPrevStep(currentStep) {
    if (STATE.isEditing) { STATE.isEditing = false; openProcessStep(3); return; }
    if (currentStep === 1) { closeProcessModal(); document.getElementById('set-modal').style.display = 'flex'; } 
    else if (currentStep === 2) { openProcessStep(1); } 
    else if (currentStep === 3) { openProcessStep(2); }
}

function editProcessStep(step) { STATE.isEditing = true; openProcessStep(step); }

function openProcessStep(step) {
    closeSetModal(); 
    
    let contentHtml = '';
    let sidebarHtml = `<div class="step-item completed"><span class="check-icon">✔</span> 세트 메뉴 / ${STATE.tempSelectedItem.name} 세트</div>`;
    let footerHtml = '';

    if (step === 1) {
        sidebarHtml += `
            <div class="step-item active">세트메뉴 사이드를 선택하세요</div>
            <div class="step-item">세트 메뉴 음료를 선택하세요</div>
            <div class="step-item" style="border-bottom:none;">주문에 추가하기</div>
        `;
        let gridHtml = '';
        setSideOptions.forEach(side => {
            const priceText = side.price > 0 ? `+₩${side.price.toLocaleString()}` : '+₩0';
            gridHtml += `
                <div class="side-card" onclick="selectProcessOption(1, '${side.name}', ${side.price}, '${side.img}')">
                    <img class="side-img" src="${side.img}">
                    <div class="side-name">${side.name}</div>
                    <div class="side-price-diff">${priceText}</div>
                    <div class="side-cal">${side.cal}</div>
                </div>`;
        });
        contentHtml = `<div class="step-title">세트메뉴 사이드를 선택하세요</div><div class="side-grid">${gridHtml}</div>`;
        
        footerHtml = `
            <div class="footer-left"><button class="footer-btn cancel-btn" onclick="closeProcessModal()">취소</button></div>
            <div class="footer-right"><button class="footer-btn prev-btn" onclick="goPrevStep(${step})">이전단계</button></div>
        `;
    }
    else if (step === 2) {
        const sideName = STATE.tempSetSelections.side ? STATE.tempSetSelections.side.name : "사이드 선택 안됨";
        sidebarHtml += `
            <div class="step-item completed"><span class="check-icon">✔</span> 사이드 / ${sideName}</div>
            <div class="step-item active">세트 메뉴 음료를 선택하세요</div>
            <div class="step-item" style="border-bottom:none;">주문에 추가하기</div>
        `;
        let gridHtml = '';
        setDrinkOptions.forEach(drink => {
            const priceText = drink.price > 0 ? `+₩${drink.price.toLocaleString()}` : '+₩0';
            gridHtml += `
                <div class="side-card" onclick="selectProcessOption(2, '${drink.name}', ${drink.price}, '${drink.img}')">
                    <img class="side-img" src="${drink.img}">
                    <div class="side-name">${drink.name}</div>
                    <div class="side-price-diff">${priceText}</div>
                    <div class="side-cal">${drink.cal}</div>
                </div>`;
        });
        contentHtml = `<div class="step-title">세트 메뉴 음료를 선택하세요</div><div class="side-grid">${gridHtml}</div>`;
        
        footerHtml = `
            <div class="footer-left"><button class="footer-btn cancel-btn" onclick="closeProcessModal()">취소</button></div>
            <div class="footer-right"><button class="footer-btn prev-btn" onclick="goPrevStep(${step})">이전단계</button></div>
        `;
    }
    else if (step === 3) {
        sidebarHtml += `
            <div class="step-item completed"><span class="check-icon">✔</span> 사이드 / ${STATE.tempSetSelections.side.name}</div>
            <div class="step-item completed"><span class="check-icon">✔</span> 음료 / ${STATE.tempSetSelections.drink.name}</div>
            <div class="step-item active" style="border-bottom:none;">주문에 추가하기</div>
        `;
        const finalPrice = STATE.tempSelectedItem.price + 2000 + STATE.tempSetSelections.side.price + STATE.tempSetSelections.drink.price;

        contentHtml = `
            <div class="confirm-wrapper">
                <div class="summary-header">
                    <div class="summary-title">${STATE.tempSelectedItem.name} 세트</div>
                    <div class="summary-price">₩ ${finalPrice.toLocaleString()}</div>
                </div>
                <img class="summary-main-img" src="${STATE.tempSelectedItem.setImg}" alt="세트 이미지">
                <div class="summary-details">
                    <div class="detail-item">
                        <img src="${STATE.tempSelectedItem.img}">
                        <span>${STATE.tempSelectedItem.name}</span>
                    </div>
                    <div class="detail-item">
                        <img src="${STATE.tempSetSelections.side.img}">
                        <span>${STATE.tempSetSelections.side.name}</span>
                        <button class="detail-change-btn" onclick="editProcessStep(1)">변경</button>
                    </div>
                    <div class="detail-item">
                        <img src="${STATE.tempSetSelections.drink.img}">
                        <span>${STATE.tempSetSelections.drink.name}</span>
                        <button class="detail-change-btn" onclick="editProcessStep(2)">변경</button>
                    </div>
                </div>
            </div>
        `;
        footerHtml = `
            <div class="footer-left"><button class="footer-btn cancel-btn" onclick="closeProcessModal()">취소</button></div>
            <div class="footer-right">
                <button class="footer-btn prev-btn" onclick="goPrevStep(${step})">이전단계</button>
                <button class="footer-btn add-btn" onclick="addSetToCartFinal()">주문에 추가</button>
            </div>
        `;
    }

    const fullScreenHtml = `
        <div class="set-step-container">
            <div class="step-header">
                <img src="mc.jpeg" alt="로고" class="step-header-logo" onerror="this.style.display='none'">
                <div class="step-header-title">${STATE.tempSelectedItem.name} 세트</div>
            </div>
            <div class="step-body">
                <div class="step-sidebar">
                    <div class="step-list">${sidebarHtml}</div>
                </div>
                <div class="step-content-wrapper">
                    <div class="step-content-inner">${contentHtml}</div>
                    <div class="step-footer">${footerHtml}</div>
                </div>
            </div>
        </div>
    `;
    document.getElementById('process-modal').innerHTML = fullScreenHtml;
    document.getElementById('process-modal').style.display = 'flex';
}

function selectProcessOption(step, name, price, img) {
    if (step === 1) { 
        STATE.tempSetSelections.side = { name, price, img }; 
        if (STATE.isEditing) { STATE.isEditing = false; openProcessStep(3); } 
        else { openProcessStep(2); }
    } 
    else if (step === 2) { 
        STATE.tempSetSelections.drink = { name, price, img }; 
        STATE.isEditing = false; openProcessStep(3); 
    }
}

function addSetToCartFinal() {
    const finalName = `${STATE.tempSelectedItem.name} 세트<span style="font-size:13px; color:#888; font-weight:600; display:block; margin-top:4px;">사이드: ${STATE.tempSetSelections.side.name}</span><span style="font-size:13px; color:#888; font-weight:600; display:block;">음료: ${STATE.tempSetSelections.drink.name}</span>`;
    const finalPrice = STATE.tempSelectedItem.price + 2000 + STATE.tempSetSelections.side.price + STATE.tempSetSelections.drink.price;
    addToCart({ name: finalName, price: finalPrice, img: STATE.tempSelectedItem.setImg });
    closeProcessModal();
}

function addToCart(newItem) {
    const existingItem = STATE.cartItems.find(item => item.name === newItem.name);
    if (existingItem) existingItem.qty += 1; else STATE.cartItems.push({ ...newItem, qty: 1 });
    renderBottom(); 
}

function resetCartConfirm() { if(STATE.cartItems.length > 0 && confirm("장바구니를 비우고 처음부터 다시 주문하시겠습니까?")) { STATE.cartItems = []; renderBottom(); } }

function openCartModal() {
    const cartModal = document.getElementById('cart-modal');
    const cartModalInner = document.getElementById('cart-modal-inner');
    if (STATE.cartItems.length === 0) { alert("결제할 상품을 먼저 선택해 주세요."); return; }
    cartModal.style.display = 'flex';
    
    let totalQty = 0; let totalPrice = 0;
    let cartHtml = `<div class="cart-wrapper-new">
        <div class="cart-header-new"><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/McDonald%27s_Golden_Arches.svg/1200px-McDonald%27s_Golden_Arches.svg.png"> 나의 주문</div>
        <div class="cart-list-new">`;

    STATE.cartItems.forEach((item, index) => {
        totalQty += item.qty;
        const itemTotal = item.price * item.qty;
        totalPrice += itemTotal;
        
        cartHtml += `<div class="c-item-row">
            <button class="c-btn-cancel" onclick="removeItem(${index})">취소</button>
            <img src="${item.img}" class="c-item-img">
            <div class="c-item-info"><div class="c-item-name">${item.name}</div></div>
            
            <div class="c-qty-wrapper">
                <div class="c-qty-ctrl">
                    <button class="qty-minus" onclick="changeQty(${index}, -1)">-</button>
                    <span class="qty-num">${item.qty}</span>
                    <button class="qty-plus" onclick="changeQty(${index}, 1)">+</button>
                </div>
            </div>
            
            <div class="c-item-price">₩ ${(item.price * item.qty).toLocaleString()}</div>
        </div>`;            });

    cartHtml += `</div>
        <div class="cart-footer-new">
            <div class="cart-summary-new">총 수량: ${totalQty}개 <span style="margin-left:30px;">합계 <strong style="font-size:32px; color:#000;">₩ ${totalPrice.toLocaleString()}</strong></span></div>
            <div class="cart-actions-new">
                <button class="cart-btn-new cart-btn-add" onclick="closeCartModal()">추가 주문</button>
                <button class="cart-btn-new cart-btn-checkout" onclick="openPaymentMethod()">주문 완료</button>
            </div>
        </div></div>`;
    cartModalInner.innerHTML = cartHtml;
}
function closeCartModal() { document.getElementById('cart-modal').style.display = 'none'; }

// 장바구니 아이템 삭제 함수 (취소 버튼)
function removeCartItem(itemName) {
    const index = STATE.cartItems.findIndex(item => item.name === itemName);
    if (index !== -1) {
        STATE.cartItems.splice(index, 1); // 해당 아이템 제거
        renderBottom(); // 하단 바 업데이트
        
        if (STATE.cartItems.length === 0) {
            closeCartModal(); // 장바구니 비면 닫기
        } else {
            openCartModal(); // 화면 다시 그리기
        }
    }
}

function changeQty(index, amount) {
    STATE.cartItems[index].qty += amount;
    if(STATE.cartItems[index].qty <= 0) STATE.cartItems.splice(index, 1); 
    renderBottom(); if(STATE.cartItems.length === 0) closeCartModal(); else openCartModal(); 
}

function removeItem(index) {
    STATE.cartItems.splice(index, 1); renderBottom();
    if(STATE.cartItems.length === 0) closeCartModal(); else openCartModal();
}

function updateScrollbar() {
    const grid = document.getElementById('k-grid'); const track = document.getElementById('k-track'); const thumb = document.getElementById('k-thumb');
    if (!grid || !track || !thumb) return;
    if (grid.scrollHeight <= grid.clientHeight) { thumb.style.display = 'none'; return; } else { thumb.style.display = 'block'; }
    let thumbHeight = (grid.clientHeight / grid.scrollHeight) * track.clientHeight;
    thumbHeight = Math.max(thumbHeight, 30);  thumb.style.height = thumbHeight + 'px';
    const scrollRatio = grid.scrollTop / (grid.scrollHeight - grid.clientHeight);
    const maxThumbTop = track.clientHeight - thumbHeight; thumb.style.top = (scrollRatio * maxThumbTop) + 'px';
}

function scrollKiosk(dir) {
    const grid = document.getElementById('k-grid'); const scrollAmount = 260; 
    if (dir === 'up') grid.scrollBy({ top: -scrollAmount, behavior: 'smooth' }); else grid.scrollBy({ top: scrollAmount, behavior: 'smooth' });
}

window.onload = () => { initApp(); window.addEventListener('resize', updateScrollbar); };
// ==========================================
// [추가됨] 3D 환경과 통신하기 위한 메시지 리스너
// ==========================================
window.addEventListener('message', (event) => {
    // 3D 밖에서 카드가 투입구에 꽂혔다는 신호가 오면!
    if (event.data && event.data.type === 'CARD_INSERTED') {
        completeCreditCardPayment();
    }
});

// ==========================================
// [V3 원본 이식] 결제창 모달 관련 함수 
// ==========================================

function openPaymentMethod() {
    const cartModalInner = document.getElementById('cart-modal-inner');
    
    // 불필요한 결제 수단 다 날리고 '신용카드'와 '취소' 딱 2개만 남김
    let payHtml = `
        <div class="pay-method-wrapper">
            <div class="pay-title">결제 수단을 선택해 주세요</div>
            <div class="pay-grid" style="display: flex !important; justify-content: center !important; gap: 40px !important;">
                
                <div class="pay-item" onclick="processPayment('신용카드')" style="width: 250px !important;">
                    <img src="https://cdn-icons-png.flaticon.com/512/633/633611.png">
                    <span>신용카드</span>
                </div>

                <div class="pay-item" onclick="openCartModal()" style="width: 250px !important;">
                    <img src="https://cdn-icons-png.flaticon.com/512/1828/1828778.png">
                    <span>취소</span>
                </div>

            </div>
        </div>
    `;
    cartModalInner.innerHTML = payHtml;
}
// ==========================================
// 스크롤 썸(노란 막대) 직접 드래그
// ==========================================
function initThumbDrag() {
    const thumb = document.getElementById('k-thumb');
    const track = document.getElementById('k-track');
    const grid  = document.getElementById('k-grid');
    if (!thumb || !track || !grid) return;

    let isDragging = false;
    let startY = 0;
    let startScrollTop = 0;

    thumb.addEventListener('mousedown', (e) => {
        isDragging = true;
        startY = e.clientY;
        startScrollTop = grid.scrollTop;
        document.body.style.userSelect = 'none';
        e.preventDefault();
        e.stopPropagation();
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const trackHeight = track.clientHeight;
        const thumbHeight = thumb.clientHeight;
        const maxThumbTop = trackHeight - thumbHeight;
        const maxScroll   = grid.scrollHeight - grid.clientHeight;
        const dy = e.clientY - startY;
        const scrollDelta = (dy / maxThumbTop) * maxScroll;
        grid.scrollTop = Math.max(0, Math.min(maxScroll, startScrollTop + scrollDelta));
        updateScrollbar();
    });

    window.addEventListener('mouseup', () => {
        if (!isDragging) return;
        isDragging = false;
        document.body.style.userSelect = '';
    });

    // 썸 커서
    thumb.style.cursor = 'grab';
}


function initDragScroll(grid) {
    if (!grid) return;

    let isDragging = false;
    let startY = 0;
    let startScrollTop = 0;
    let hasDragged = false;

    // --- 마우스 드래그 ---
    grid.addEventListener('mousedown', (e) => {
        // 버튼 클릭은 드래그 시작 제외
        if (e.target.closest('button')) return;
        isDragging = true;
        hasDragged = false;
        startY = e.clientY;
        startScrollTop = grid.scrollTop;
        grid.style.cursor = 'grabbing';
        e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dy = e.clientY - startY;
        if (Math.abs(dy) > 5) hasDragged = true;
        grid.scrollTop = startScrollTop - dy;
        updateScrollbar();
    });

    window.addEventListener('mouseup', (e) => {
        if (!isDragging) return;
        isDragging = false;
        grid.style.cursor = 'grab';
        // 드래그가 실제로 일어났으면 카드 클릭 이벤트 차단
        if (hasDragged) {
            e.stopPropagation();
            // 다음 클릭 이벤트 한 번 무시
            const block = (ev) => { ev.stopPropagation(); grid.removeEventListener('click', block, true); };
            grid.addEventListener('click', block, true);
        }
    });

    // --- 터치 드래그 (모바일/터치스크린 키오스크) ---
    let touchStartY = 0;
    let touchScrollTop = 0;
    let touchMoved = false;

    grid.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
        touchScrollTop = grid.scrollTop;
        touchMoved = false;
    }, { passive: true });

    grid.addEventListener('touchmove', (e) => {
        const dy = e.touches[0].clientY - touchStartY;
        if (Math.abs(dy) > 5) touchMoved = true;
        grid.scrollTop = touchScrollTop - dy;
        updateScrollbar();
    }, { passive: true });

    grid.addEventListener('touchend', (e) => {
        if (touchMoved) e.preventDefault();
    });
}