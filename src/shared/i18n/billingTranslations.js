// Billing labels added with the invoice breakdown and account statement API update.
const billingTranslations = {
  en: {
    invoices: {
      totalQuantity: 'Total Quantity', deliveryCharges: 'Delivery Charges', extraCharges: 'Extra Charges', discounts: 'Discounts',
      thisInvoiceTotal: 'This Invoice Total', previousDuesInfo: 'Previous Dues (Info)',
      advanceCreditInfo: 'Advance Credit (Info)',
      startBefore2020: 'Period start cannot be before January 2020.',
      startAfterToday: 'Period start cannot be in the future.',
      endAfterToday: 'Period end cannot be in the future.',
      noNewInvoices: 'No new invoices were generated for this period.',
      generatedSuccessfully: 'Invoices generated successfully.', generateFailed: 'Could not generate invoices.',
    },
    payments: {
      paymentReceived: 'Payment Received', extraChargeAdded: 'Extra Charge Added',
      creditAdjusted: 'Credit Adjusted', depositToBill: 'Deposit Applied to Bill',
      advanceCredit: 'Advance Credit', accountClear: 'Account Clear',
      paymentFailed: 'Could not record payment.', paymentRecorded: 'Payment recorded successfully.',
    },
  },
  hi: {
    invoices: {
      totalQuantity: 'कुल मात्रा', deliveryCharges: 'डिलीवरी शुल्क', extraCharges: 'अतिरिक्त शुल्क', discounts: 'छूट',
      thisInvoiceTotal: 'इस इनवॉइस का कुल', previousDuesInfo: 'पिछला बकाया (जानकारी)',
      advanceCreditInfo: 'अग्रिम जमा (जानकारी)',
      startBefore2020: 'अवधि की शुरुआत जनवरी 2020 से पहले नहीं हो सकती।',
      startAfterToday: 'अवधि की शुरुआत भविष्य की तारीख नहीं हो सकती।',
      endAfterToday: 'अवधि का अंत भविष्य की तारीख नहीं हो सकता।',
      noNewInvoices: 'इस अवधि के लिए कोई नया इनवॉइस नहीं बना।',
      generatedSuccessfully: 'इनवॉइस सफलतापूर्वक बनाए गए।', generateFailed: 'इनवॉइस नहीं बनाए जा सके।',
    },
    payments: {
      paymentReceived: 'भुगतान प्राप्त', extraChargeAdded: 'अतिरिक्त शुल्क जोड़ा गया',
      creditAdjusted: 'क्रेडिट समायोजित', depositToBill: 'जमा राशि बिल में समायोजित',
      advanceCredit: 'अग्रिम जमा', accountClear: 'खाता साफ़',
      paymentFailed: 'भुगतान दर्ज नहीं हो सका।', paymentRecorded: 'भुगतान सफलतापूर्वक दर्ज हुआ।',
    },
  },
  mr: {
    invoices: {
      totalQuantity: 'एकूण प्रमाण', deliveryCharges: 'वितरण शुल्क', extraCharges: 'अतिरिक्त शुल्क', discounts: 'सवलती',
      thisInvoiceTotal: 'या बिलाची एकूण रक्कम', previousDuesInfo: 'मागील थकबाकी (माहिती)',
      advanceCreditInfo: 'आगाऊ जमा (माहिती)',
      startBefore2020: 'कालावधीची सुरुवात जानेवारी २०२० पूर्वीची असू शकत नाही.',
      startAfterToday: 'कालावधीची सुरुवात भविष्यातील असू शकत नाही.',
      endAfterToday: 'कालावधीचा शेवट भविष्यातील असू शकत नाही.',
      noNewInvoices: 'या कालावधीसाठी नवीन बिले तयार झाली नाहीत.',
      generatedSuccessfully: 'बिले यशस्वीपणे तयार झाली.', generateFailed: 'बिले तयार करता आली नाहीत.',
    },
    payments: {
      paymentReceived: 'देयक प्राप्त', extraChargeAdded: 'अतिरिक्त शुल्क जोडले',
      creditAdjusted: 'जमा रक्कम समायोजित', depositToBill: 'ठेव बिलात समायोजित',
      advanceCredit: 'आगाऊ जमा', accountClear: 'खाते चुकते',
      paymentFailed: 'देयक नोंदवता आले नाही.', paymentRecorded: 'देयक यशस्वीपणे नोंदवले.',
    },
  },
  bn: {
    invoices: {
      totalQuantity: 'মোট পরিমাণ', deliveryCharges: 'ডেলিভারি চার্জ', extraCharges: 'অতিরিক্ত চার্জ', discounts: 'ছাড়',
      thisInvoiceTotal: 'এই চালানের মোট', previousDuesInfo: 'আগের বকেয়া (তথ্য)',
      advanceCreditInfo: 'অগ্রিম জমা (তথ্য)',
      startBefore2020: 'সময়ের শুরু জানুয়ারি ২০২০-এর আগে হতে পারে না।',
      startAfterToday: 'সময়ের শুরু ভবিষ্যতের তারিখ হতে পারে না।',
      endAfterToday: 'সময়ের শেষ ভবিষ্যতের তারিখ হতে পারে না।',
      noNewInvoices: 'এই সময়ের জন্য নতুন চালান তৈরি হয়নি।',
      generatedSuccessfully: 'চালান সফলভাবে তৈরি হয়েছে।', generateFailed: 'চালান তৈরি করা যায়নি।',
    },
    payments: {
      paymentReceived: 'পেমেন্ট পাওয়া গেছে', extraChargeAdded: 'অতিরিক্ত চার্জ যোগ করা হয়েছে',
      creditAdjusted: 'ক্রেডিট সমন্বয় করা হয়েছে', depositToBill: 'জমা বিলের সঙ্গে সমন্বয়',
      advanceCredit: 'অগ্রিম জমা', accountClear: 'হিসাব পরিষ্কার',
      paymentFailed: 'পেমেন্ট নথিভুক্ত করা যায়নি।', paymentRecorded: 'পেমেন্ট সফলভাবে নথিভুক্ত হয়েছে।',
    },
  },
  ta: {
    invoices: {
      totalQuantity: 'மொத்த அளவு', deliveryCharges: 'விநியோகக் கட்டணம்', extraCharges: 'கூடுதல் கட்டணம்', discounts: 'தள்ளுபடிகள்',
      thisInvoiceTotal: 'இந்த விலைப்பட்டியலின் மொத்தம்', previousDuesInfo: 'முந்தைய நிலுவை (தகவல்)',
      advanceCreditInfo: 'முன்பணம் (தகவல்)',
      startBefore2020: 'காலத்தின் தொடக்கம் ஜனவரி 2020க்கு முன் இருக்க முடியாது.',
      startAfterToday: 'காலத்தின் தொடக்கம் எதிர்காலத் தேதியாக இருக்க முடியாது.',
      endAfterToday: 'காலத்தின் முடிவு எதிர்காலத் தேதியாக இருக்க முடியாது.',
      noNewInvoices: 'இந்த காலத்திற்கு புதிய விலைப்பட்டியல் உருவாக்கப்படவில்லை.',
      generatedSuccessfully: 'விலைப்பட்டியல் வெற்றிகரமாக உருவாக்கப்பட்டது.', generateFailed: 'விலைப்பட்டியலை உருவாக்க முடியவில்லை.',
    },
    payments: {
      paymentReceived: 'கட்டணம் பெறப்பட்டது', extraChargeAdded: 'கூடுதல் கட்டணம் சேர்க்கப்பட்டது',
      creditAdjusted: 'வரவு சரிசெய்யப்பட்டது', depositToBill: 'வைப்புத்தொகை பில்லில் பயன்படுத்தப்பட்டது',
      advanceCredit: 'முன்பணம்', accountClear: 'கணக்கு தீர்ந்தது',
      paymentFailed: 'கட்டணத்தைப் பதிவு செய்ய முடியவில்லை.', paymentRecorded: 'கட்டணம் வெற்றிகரமாகப் பதிவு செய்யப்பட்டது.',
    },
  },
  te: {
    invoices: {
      totalQuantity: 'మొత్తం పరిమాణం', deliveryCharges: 'డెలివరీ ఛార్జీలు', extraCharges: 'అదనపు ఛార్జీలు', discounts: 'తగ్గింపులు',
      thisInvoiceTotal: 'ఈ ఇన్‌వాయిస్ మొత్తం', previousDuesInfo: 'గత బకాయిలు (సమాచారం)',
      advanceCreditInfo: 'ముందస్తు జమ (సమాచారం)',
      startBefore2020: 'కాలం ప్రారంభం జనవరి 2020 కంటే ముందు ఉండకూడదు.',
      startAfterToday: 'కాలం ప్రారంభం భవిష్యత్తు తేదీ కాకూడదు.',
      endAfterToday: 'కాలం ముగింపు భవిష్యత్తు తేదీ కాకూడదు.',
      noNewInvoices: 'ఈ కాలానికి కొత్త ఇన్‌వాయిస్‌లు రూపొందలేదు.',
      generatedSuccessfully: 'ఇన్‌వాయిస్‌లు విజయవంతంగా రూపొందాయి.', generateFailed: 'ఇన్‌వాయిస్‌లను రూపొందించలేకపోయాం.',
    },
    payments: {
      paymentReceived: 'చెల్లింపు అందింది', extraChargeAdded: 'అదనపు ఛార్జీ జోడించబడింది',
      creditAdjusted: 'క్రెడిట్ సర్దుబాటు చేయబడింది', depositToBill: 'డిపాజిట్ బిల్లుకు వర్తింపజేయబడింది',
      advanceCredit: 'ముందస్తు జమ', accountClear: 'ఖాతా బాకీ లేదు',
      paymentFailed: 'చెల్లింపును నమోదు చేయలేకపోయాం.', paymentRecorded: 'చెల్లింపు విజయవంతంగా నమోదైంది.',
    },
  },
  gu: {
    invoices: {
      totalQuantity: 'કુલ જથ્થો', deliveryCharges: 'ડિલિવરી ચાર્જ', extraCharges: 'વધારાના ચાર્જ', discounts: 'છૂટ',
      thisInvoiceTotal: 'આ ઇન્વૉઇસનું કુલ', previousDuesInfo: 'પાછલી બાકી રકમ (માહિતી)',
      advanceCreditInfo: 'અગાઉથી જમા (માહિતી)',
      startBefore2020: 'સમયગાળાની શરૂઆત જાન્યુઆરી ૨૦૨૦ પહેલાં હોઈ શકતી નથી.',
      startAfterToday: 'સમયગાળાની શરૂઆત ભવિષ્યની તારીખ હોઈ શકતી નથી.',
      endAfterToday: 'સમયગાળાનો અંત ભવિષ્યની તારીખ હોઈ શકતો નથી.',
      noNewInvoices: 'આ સમયગાળા માટે નવા ઇન્વૉઇસ બન્યા નથી.',
      generatedSuccessfully: 'ઇન્વૉઇસ સફળતાપૂર્વક બન્યા.', generateFailed: 'ઇન્વૉઇસ બનાવી શકાયા નથી.',
    },
    payments: {
      paymentReceived: 'ચુકવણી પ્રાપ્ત થઈ', extraChargeAdded: 'વધારાનો ચાર્જ ઉમેરાયો',
      creditAdjusted: 'ક્રેડિટ સમાયોજિત', depositToBill: 'જમા રકમ બિલમાં સમાયોજિત',
      advanceCredit: 'અગાઉથી જમા', accountClear: 'ખાતું ચૂકતું',
      paymentFailed: 'ચુકવણી નોંધાઈ શકી નથી.', paymentRecorded: 'ચુકવણી સફળતાપૂર્વક નોંધાઈ.',
    },
  },
  pa: {
    invoices: {
      totalQuantity: 'ਕੁੱਲ ਮਾਤਰਾ', deliveryCharges: 'ਡਿਲਿਵਰੀ ਖਰਚੇ', extraCharges: 'ਵਾਧੂ ਖਰਚੇ', discounts: 'ਛੋਟਾਂ',
      thisInvoiceTotal: 'ਇਸ ਇਨਵੌਇਸ ਦਾ ਕੁੱਲ', previousDuesInfo: 'ਪਿਛਲਾ ਬਕਾਇਆ (ਜਾਣਕਾਰੀ)',
      advanceCreditInfo: 'ਅਗਾਊਂ ਜਮ੍ਹਾਂ (ਜਾਣਕਾਰੀ)',
      startBefore2020: 'ਮਿਆਦ ਦੀ ਸ਼ੁਰੂਆਤ ਜਨਵਰੀ 2020 ਤੋਂ ਪਹਿਲਾਂ ਨਹੀਂ ਹੋ ਸਕਦੀ।',
      startAfterToday: 'ਮਿਆਦ ਦੀ ਸ਼ੁਰੂਆਤ ਭਵਿੱਖ ਦੀ ਮਿਤੀ ਨਹੀਂ ਹੋ ਸਕਦੀ।',
      endAfterToday: 'ਮਿਆਦ ਦਾ ਅੰਤ ਭਵਿੱਖ ਦੀ ਮਿਤੀ ਨਹੀਂ ਹੋ ਸਕਦਾ।',
      noNewInvoices: 'ਇਸ ਮਿਆਦ ਲਈ ਕੋਈ ਨਵਾਂ ਇਨਵੌਇਸ ਨਹੀਂ ਬਣਿਆ।',
      generatedSuccessfully: 'ਇਨਵੌਇਸ ਸਫਲਤਾਪੂਰਵਕ ਬਣ ਗਏ।', generateFailed: 'ਇਨਵੌਇਸ ਨਹੀਂ ਬਣ ਸਕੇ।',
    },
    payments: {
      paymentReceived: 'ਭੁਗਤਾਨ ਮਿਲਿਆ', extraChargeAdded: 'ਵਾਧੂ ਖਰਚਾ ਜੋੜਿਆ ਗਿਆ',
      creditAdjusted: 'ਕ੍ਰੈਡਿਟ ਸਮਾਇਤ ਕੀਤਾ ਗਿਆ', depositToBill: 'ਜਮ੍ਹਾਂ ਰਕਮ ਬਿੱਲ ਵਿੱਚ ਲਗਾਈ ਗਈ',
      advanceCredit: 'ਅਗਾਊਂ ਜਮ੍ਹਾਂ', accountClear: 'ਖਾਤਾ ਸਾਫ਼',
      paymentFailed: 'ਭੁਗਤਾਨ ਦਰਜ ਨਹੀਂ ਹੋ ਸਕਿਆ।', paymentRecorded: 'ਭੁਗਤਾਨ ਸਫਲਤਾਪੂਰਵਕ ਦਰਜ ਹੋਇਆ।',
    },
  },
};

export default billingTranslations;
