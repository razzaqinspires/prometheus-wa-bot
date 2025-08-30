// services/menu/menuUtils.js
import fs from 'fs/promises';
import path from 'path';
import { aiState } from '../AIStateManager.js';

// Data statis untuk font, tema, dan ikon
export const FONT_MAPS = {
    // -------- 1. Latin Styles (Mathematical Unicode) --------
    bold: {
        a:'𝗮',b:'𝗯',c:'𝗰',d:'𝗱',e:'𝗲',f:'𝗳',g:'𝗴',h:'𝗵',i:'𝗶',j:'𝗷',k:'𝗸',l:'𝗹',m:'𝗺',n:'𝗻',o:'𝗼',p:'𝗽',q:'𝗾',r:'𝗿',s:'𝘀',t:'𝘁',u:'𝘂',v:'𝘃',w:'𝘄',x:'𝘅',y:'𝘆',z:'𝘇',
        A:'𝗔',B:'𝗕',C:'𝗖',D:'𝗗',E:'𝗘',F:'𝗙',G:'𝗚',H:'𝗛',I:'𝗜',J:'𝗝',K:'𝗞',L:'𝗟',M:'𝗠',N:'𝗡',O:'𝗢',P:'𝗣',Q:'𝗤',R:'𝗥',S:'𝗦',T:'𝗧',U:'𝗨',V:'𝗩',W:'𝗪',X:'𝗫',Y:'𝗬',Z:'𝗭',
        0:'𝟬',1:'𝟭',2:'𝟮',3:'𝟯',4:'𝟰',5:'𝟱',6:'𝟲',7:'𝟳',8:'𝟴',9:'𝟵'
    },
    italic: {
        a:'𝘢',b:'𝘣',c:'𝘤',d:'𝘥',e:'𝘦',f:'𝘧',g:'𝘨',h:'𝘩',i:'𝘪',j:'𝘫',k:'𝘬',l:'𝘭',m:'𝘮',n:'𝘯',o:'𝘰',p:'𝘱',q:'𝘲',r:'𝘳',s:'𝘴',t:'𝘵',u:'𝘶',v:'𝘷',w:'𝘸',x:'𝘹',y:'𝘺',z:'𝘻',
        A:'𝘈',B:'𝘉',C:'𝘊',D:'𝘋',E:'𝘌',F:'𝘍',G:'𝘎',H:'𝘏',I:'𝘐',J:'𝘑',K:'𝘒',L:'𝘓',M:'𝘔',N:'𝘕',O:'𝘖',P:'𝘗',Q:'𝘘',R:'𝘙',S:'𝘚',T:'𝘛',U:'𝘜',V:'𝘝',W:'𝘞',X:'𝘟',Y:'𝘠',Z:'𝘡'
    },
    boldItalic: {
        a:'𝙖',b:'𝙗',c:'𝙘',d:'𝙙',e:'𝙚',f:'𝙛',g:'𝙜',h:'𝙝',i:'𝙞',j:'𝙟',k:'𝙠',l:'𝙡',m:'𝙢',n:'𝙣',o:'𝙤',p:'𝙥',q:'𝙦',r:'𝙧',s:'𝙨',t:'𝙩',u:'𝙪',v:'𝙫',w:'𝙬',x:'𝙭',y:'𝙮',z:'𝙯',
        A:'𝘼',B:'𝘽',C:'𝘾',D:'𝘿',E:'𝙀',F:'𝙁',G:'𝙂',H:'𝙃',I:'𝙄',J:'𝙅',K:'𝙆',L:'𝙇',M:'𝙈',N:'𝙉',O:'𝙊',P:'𝙋',Q:'𝙌',R:'𝙍',S:'𝙎',T:'𝙏',U:'𝙐',V:'𝙑',W:'𝙒',X:'𝙓',Y:'𝙔',Z:'𝙕'
    },
    monospace: {
        a:'𝚊',b:'𝚋',c:'𝚌',d:'𝚍',e:'𝚎',f:'𝚏',g:'𝚐',h:'𝚑',i:'𝚒',j:'𝚓',k:'𝚔',l:'𝚕',m:'𝚖',n:'𝚗',o:'𝚘',p:'𝚙',q:'𝚚',r:'𝚛',s:'𝚜',t:'𝚝',u:'𝚞',v:'𝚟',w:'𝚠',x:'𝚡',y:'𝚢',z:'𝚣',
        A:'𝙰',B:'𝙱',C:'𝙲',D:'𝙳',E:'𝙴',F:'𝙵',G:'𝙶',H:'𝙷',I:'𝙸',J:'𝙹',K:'𝙺',L:'𝙻',M:'𝙼',N:'𝙽',O:'𝙾',P:'𝙿',Q:'𝚀',R:'𝚁',S:'𝚂',T:'𝚃',U:'𝚄',V:'𝚅',W:'𝚆',X:'𝚇',Y:'𝚈',Z:'𝚉',
        0:'𝟶',1:'𝟷',2:'𝟸',3:'𝟹',4:'𝟺',5:'𝟻',6:'𝟼',7:'𝟽',8:'𝟾',9:'𝟿'
    },
    sansSerif: {
        a:'𝖺',b:'𝖻',c:'𝖼',d:'𝖽',e:'𝖾',f:'𝖿',g:'𝗀',h:'𝗁',i:'𝗂',j:'𝗃',k:'𝗄',l:'𝗅',m:'𝗆',n:'𝗇',o:'𝗈',p:'𝗉',q:'𝗊',r:'𝗋',s:'𝗌',t:'𝗍',u:'𝗎',v:'𝗏',w:'𝗐',x:'𝗑',y:'𝗒',z:'𝗓',
        A:'𝖠',B:'𝖡',C:'𝖢',D:'𝖣',E:'𝖤',F:'𝖥',G:'𝖦',H:'𝖧',I:'𝖨',J:'𝖩',K:'𝖪',L:'𝖫',M:'𝖬',N:'𝖭',O:'𝖮',P:'𝖯',Q:'𝖰',R:'𝖱',S:'𝖲',T:'𝖳',U:'𝖴',V:'𝖵',W:'𝖶',X:'𝖷',Y:'𝖸',Z:'𝖹'
    },
    script: {
        a:'𝓪',b:'𝓫',c:'𝓬',d:'𝓭',e:'𝓮',f:'𝓯',g:'𝓰',h:'𝓱',i:'𝓲',j:'𝓳',k:'𝓴',l:'𝓵',m:'𝓶',n:'𝓷',o:'𝓸',p:'𝓹',q:'𝓺',r:'𝓻',s:'𝓼',t:'𝓽',u:'𝓾',v:'𝓿',w:'𝔀',x:'𝔁',y:'𝔂',z:'𝔃',
        A:'𝓐',B:'𝓑',C:'𝓒',D:'𝓓',E:'𝓔',F:'𝓕',G:'𝓖',H:'𝓗',I:'𝓘',J:'𝓙',K:'𝓚',L:'𝓛',M:'𝓜',N:'𝓝',O:'𝓞',P:'𝓟',Q:'𝓠',R:'𝓡',S:'𝓢',T:'𝓣',U:'𝓤',V:'𝓥',W:'𝓦',X:'𝓧',Y:'𝓨',Z:'𝓩'
    },
    fraktur: {
        a:'𝔞',b:'𝔟',c:'𝔠',d:'𝔡',e:'𝔢',f:'𝔣',g:'𝔤',h:'𝔥',i:'𝔦',j:'𝔧',k:'𝔨',l:'𝔩',m:'𝔪',n:'𝔫',o:'𝔬',p:'𝔭',q:'𝔮',r:'𝔯',s:'𝔰',t:'𝔱',u:'𝔲',v:'𝔳',w:'𝔴',x:'𝔵',y:'𝔶',z:'𝔷',
        A:'𝔄',B:'𝔅',C:'ℭ',D:'𝔇',E:'𝔈',F:'𝔉',G:'𝔊',H:'ℌ',I:'ℑ',J:'𝔍',K:'𝔎',L:'𝔏',M:'𝔐',N:'𝔑',O:'𝔒',P:'𝔓',Q:'𝔔',R:'ℜ',S:'𝔖',T:'𝔗',U:'𝔘',V:'𝔙',W:'𝔚',X:'𝔛',Y:'𝔜',Z:'ℨ'
    },
    doubleStruck: {
        a:'𝕒',b:'𝕓',c:'𝕔',d:'𝕕',e:'𝕖',f:'𝕗',g:'𝕘',h:'𝕙',i:'𝕚',j:'𝕛',k:'𝕜',l:'𝕝',m:'𝕞',n:'𝕟',o:'𝕠',p:'𝕡',q:'𝕢',r:'𝕣',s:'𝕤',t:'𝕥',u:'𝕦',v:'𝕧',w:'𝕨',x:'𝕩',y:'𝕪',z:'𝕫',
        A:'𝔸',B:'𝔹',C:'ℂ',D:'𝔻',E:'𝔼',F:'𝔽',G:'𝔾',H:'ℍ',I:'𝕀',J:'𝕁',K:'𝕂',L:'𝕃',M:'𝕄',N:'ℕ',O:'𝕆',P:'ℙ',Q:'ℚ',R:'ℝ',S:'𝕊',T:'𝕋',U:'𝕌',V:'𝕍',W:'𝕎',X:'𝕏',Y:'𝕐',Z:'ℤ',
        0:'𝟘',1:'𝟙',2:'𝟚',3:'𝟛',4:'𝟜',5:'𝟝',6:'𝟞',7:'𝟟',8:'𝟠',9:'𝟡'
    },

    // -------- 2. Aesthetic / Decorative --------
    circled: {
        a:'ⓐ',b:'ⓑ',c:'ⓒ',d:'ⓓ',e:'ⓔ',f:'ⓕ',g:'ⓖ',h:'ⓗ',i:'ⓘ',j:'ⓙ',k:'ⓚ',l:'ⓛ',m:'ⓜ',n:'ⓝ',o:'ⓞ',p:'ⓟ',q:'ⓠ',r:'ⓡ',s:'ⓢ',t:'ⓣ',u:'ⓤ',v:'ⓥ',w:'ⓦ',x:'ⓧ',y:'ⓨ',z:'ⓩ',
        A:'Ⓐ',B:'Ⓑ',C:'Ⓒ',D:'Ⓓ',E:'Ⓔ',F:'Ⓕ',G:'Ⓖ',H:'Ⓗ',I:'Ⓘ',J:'Ⓙ',K:'Ⓚ',L:'Ⓛ',M:'Ⓜ',N:'Ⓝ',O:'Ⓞ',P:'Ⓟ',Q:'Ⓠ',R:'Ⓡ',S:'Ⓢ',T:'Ⓣ',U:'Ⓤ',V:'Ⓥ',W:'Ⓦ',X:'Ⓧ',Y:'Ⓨ',Z:'Ⓩ',
        0:'⓿',1:'①',2:'②',3:'③',4:'④',5:'⑤',6:'⑥',7:'⑦',8:'⑧',9:'⑨'
    },
    squared: {
        A:'🄰',B:'🄱',C:'🄲',D:'🄳',E:'🄴',F:'🄵',G:'🄶',H:'🄷',I:'🄸',J:'🄹',K:'🄺',L:'🄻',M:'🄼',N:'🄽',O:'🄾',P:'🄿',Q:'🅀',R:'🅁',S:'🅂',T:'🅃',U:'🅄',V:'🅅',W:'🅆',X:'🅇',Y:'🅈',Z:'🅉'
    },
    bubble: {
        a:'🅐',b:'🅑',c:'🅒',d:'🅓',e:'🅔',f:'🅕',g:'🅖',h:'🅗',i:'🅘',j:'🅙',k:'🅚',l:'🅛',m:'🅜',n:'🅝',o:'🅞',p:'🅟',q:'🅠',r:'🅡',s:'🅢',t:'🅣',u:'🅤',v:'🅥',w:'🅦',x:'🅧',y:'🅨',z:'🅩',
        A:'🅐',B:'🅑',C:'🅒',D:'🅓',E:'🅔',F:'🅕',G:'🅖',H:'🅗',I:'🅘',J:'🅙',K:'🅚',L:'🅛',M:'🅜',N:'🅝',O:'🅞',P:'🅟',Q:'🅠',R:'🅡',S:'🅢',T:'🅣',U:'🅤',V:'🅥',W:'🅦',X:'🅧',Y:'🅨',Z:'🅩'
    },
    fullwidth: {
        a:'ａ',b:'ｂ',c:'ｃ',d:'ｄ',e:'ｅ',f:'ｆ',g:'ｇ',h:'ｈ',i:'ｉ',j:'ｊ',k:'ｋ',l:'ｌ',m:'ｍ',n:'ｎ',o:'ｏ',p:'ｐ',q:'ｑ',r:'ｒ',s:'ｓ',t:'ｔ',u:'ｕ',v:'ｖ',w:'ｗ',x:'ｘ',y:'ｙ',z:'ｚ',
        A:'Ａ',B:'Ｂ',C:'Ｃ',D:'Ｄ',E:'Ｅ',F:'Ｆ',G:'Ｇ',H:'Ｈ',I:'Ｉ',J:'Ｊ',K:'Ｋ',L:'Ｌ',M:'Ｍ',N:'Ｎ',O:'Ｏ',P:'Ｐ',Q:'Ｑ',R:'Ｒ',S:'Ｓ',T:'Ｔ',U:'Ｕ',V:'Ｖ',W:'Ｗ',X:'Ｘ',Y:'Ｙ',Z:'Ｚ',
        0:'０',1:'１',2:'２',3:'３',4:'４',5:'５',6:'６',7:'７',8:'８',9:'９'
    },
    tiny: {
        a:'ᵃ', b:'ᵇ', c:'ᶜ', d:'ᵈ', e:'ᵉ', f:'ᶠ', g:'ᵍ', h:'ʰ', i:'ⁱ', j:'ʲ', k:'ᵏ', l:'ˡ', m:'ᵐ', n:'ⁿ', o:'ᵒ', p:'ᵖ', q:'ᑫ', r:'ʳ', s:'ˢ', t:'ᵗ', u:'ᵘ', v:'ᵛ', w:'ʷ', x:'ˣ', y:'ʸ', z:'ᶻ',
        A:'ᴬ', B:'ᴮ', C:'ᶜ', D:'ᴰ', E:'ᴱ', F:'ᶠ', G:'ᴳ', H:'ᴴ', I:'ᴵ', J:'ᴶ', K:'ᴷ', L:'ᴸ', M:'ᴹ', N:'ᴺ', O:'ᴼ', P:'ᴾ', Q:'Q', R:'ᴿ', S:'ˢ', T:'ᵀ', U:'ᵁ', V:'ⱽ', W:'ᵂ', X:'ˣ', Y:'ʸ', Z:'ᶻ',
        0:'⁰', 1:'¹', 2:'²', 3:'³', 4:'⁴', 5:'⁵', 6:'⁶', 7:'⁷', 8:'⁸', 9:'⁹'
    },
    smallCaps: {
        a:'ᴀ', b:'ʙ', c:'ᴄ', d:'ᴅ', e:'ᴇ', f:'ꜰ', g:'ɢ', h:'ʜ', i:'ɪ', j:'ᴊ', k:'ᴋ', l:'ʟ', m:'ᴍ', n:'ɴ', o:'ᴏ', p:'ᴘ', q:'Q', r:'ʀ', s:'s', t:'ᴛ', u:'ᴜ', v:'ᴠ', w:'ᴡ', x:'x', y:'ʏ', z:'ᴢ',
        A:'ᴀ', B:'ʙ', C:'ᴄ', D:'ᴅ', E:'ᴇ', F:'ꜰ', G:'ɢ', H:'ʜ', I:'ɪ', J:'ᴊ', K:'ᴋ', L:'ʟ', M:'ᴍ', N:'ɴ', O:'ᴏ', P:'ᴘ', Q:'Q', R:'ʀ', S:'s', T:'ᴛ', U:'ᴜ', V:'ᴠ', W:'ᴡ', X:'x', Y:'ʏ', Z:'ᴢ',
        0:'0', 1:'1', 2:'2', 3:'3', 4:'4', 5:'5', 6:'6', 7:'7', 8:'8', 9:'9'
    },
    upsideDown: {
        a:'ɐ', b:'q', c:'ɔ', d:'p', e:'ǝ', f:'ɟ', g:'ƃ', h:'ɥ', i:'ᴉ', j:'ɾ', k:'ʞ', l:'ʃ', m:'ɯ', n:'u', o:'o', p:'d', q:'b', r:'ɹ', s:'s', t:'ʇ', u:'n', v:'ʌ', w:'ʍ', x:'x', y:'ʎ', z:'z',
        A:'∀', B:'ᙠ', C:'Ɔ', D:'ᗡ', E:'Ǝ', F:'Ⅎ', G:'פ', H:'H', I:'I', J:'ſ', K:'ʞ', L:'˥', M:'W', N:'N', O:'O', P:'Ԁ', Q:'Ό', R:'ᴚ', S:'S', T:'⊥', U:'∩', V:'Λ', W:'M', X:'X', Y:'⅄', Z:'Z',
        0:'0', 1:'Ɩ', 2:'ᄅ', 3:'Ɛ', 4:'ㄣ', 5:'ϛ', 6:'9', 7:'ㄥ', 8:'8', 9:'6'
    },
    mirror: {
        a:'ɒ', b:'d', c:'ɔ', d:'b', e:'ɘ', f:'Ꮈ', g:'ǫ', h:'ʜ', i:'i', j:'Ⴑ', k:'ʞ', l:'l', m:'m', n:'ᴎ', o:'o', p:'q', q:'p', r:'ɿ', s:'ƨ', t:'ᴛ', u:'υ', v:'ʌ', w:'ʍ', x:'x', y:'ʏ', z:'z',
        A:'A', B:'ᙠ', C:'Ɔ', D:'ᗡ', E:'Ǝ', F:'ꟻ', G:'Ꭾ', H:'H', I:'I', J:'Ⴑ', K:'ꓘ', L:'⅃', M:'M', N:'Ͷ', O:'O', P:'ᑫ', Q:'Ό', R:'Я', S:'Ƨ', T:'T', U:'Ⴎ', V:'Λ', W:'M', X:'X', Y:'⅄', Z:'Z',
        0:'0', 1:'⇂', 2:'ᘔ', 3:'Ɛ', 4:'ᔭ', 5:'5', 6:'9', 7:'𝘓', 8:'8', 9:'6'
    },
    oldEnglish: {
        a:'𝔞', b:'𝔟', c:'𝔠', d:'𝔡', e:'𝔢', f:'𝔣', g:'𝔤', h:'𝔥', i:'𝔦', j:'𝔧', k:'𝔨', l:'𝔩', m:'𝔪', n:'𝔫', o:'𝔬', p:'𝔭', q:'𝔮', r:'𝔯', s:'𝔰', t:'𝔱', u:'𝔲', v:'𝔳', w:'𝔴', x:'𝔵', y:'𝔶', z:'𝔷',
        A:'𝔄', B:'𝔅', C:'ℭ', D:'𝔇', E:'𝔈', F:'𝔉', G:'𝔊', H:'ℌ', I:'ℑ', J:'𝔍', K:'𝔎', L:'𝔏', M:'𝔐', N:'𝔑', O:'𝔒', P:'𝔓', Q:'𝔔', R:'ℜ', S:'𝔖', T:'𝔗', U:'𝔘', V:'𝔙', W:'𝔚', X:'𝔛', Y:'𝔜', Z:'ℨ',
        0:'0', 1:'1', 2:'2', 3:'3', 4:'4', 5:'5', 6:'6', 7:'7', 8:'8', 9:'9'
    },
    emojiRegional: {
        A:'🇦', B:'🇧', C:'🇨', D:'🇩', E:'🇪', F:'🇫', G:'🇬', H:'🇭', I:'🇮', J:'🇯', K:'🇰', L:'🇱', M:'🇲', N:'🇳', O:'🇴', P:'🇵', Q:'🇶', R:'🇷', S:'🇸', T:'🇹', U:'🇺', V:'🇻', W:'🇼', X:'🇽', Y:'🇾', Z:'🇿'
    },
    emojiSymbol: {
        a:'🅰️', b:'🅱️', o:'🅾️', p:'🅿️', s:'Ⓢ', q:'🆀', r:'🆁', t:'🆃', u:'🆄', v:'🆅', w:'🆆', x:'🆇', y:'🆈', z:'🆉',
        A:'🅰️', B:'🅱️', C:'🆑', D:'🆓', E:'📧', F:'🎏', G:'🌀', H:'♓', I:'ℹ️', J:'🎷', K:'🎋', L:'👢', M:'Ⓜ️', N:'🎶', O:'🅾️', P:'🅿️', Q:'🇶', R:'🆁', S:'💲', T:'✝️', U:'⛎', V:'♈', W:'〰️', X:'❌', Y:'🍸', Z:'💤',
        0:'0️⃣', 1:'1️⃣', 2:'2️⃣', 3:'3️⃣', 4:'4️⃣', 5:'5️⃣', 6:'6️⃣', 7:'7️⃣', 8:'8️⃣', 9:'9️⃣'
    },
    blackSquare: {
        A:'🆎', B:'🅱️', C:'🆑', D:'🆔', E:'🆓', F:'🆕', G:'🆖', H:'🆗', I:'🆘', J:'🆙', K:'🆒', L:'🆚', M:'Ⓜ️', N:'🅾️', O:'🅾️', P:'🅿️', Q:'🇶', R:'🆁', S:'🆂', T:'🆃', U:'🆄', V:'🆅', W:'🆆', X:'🆇', Y:'🆈', Z:'🆉',
        0:'0️⃣', 1:'1️⃣', 2:'2️⃣', 3:'3️⃣', 4:'4️⃣', 5:'5️⃣', 6:'6️⃣', 7:'7️⃣', 8:'8️⃣', 9:'9️⃣'
    },
    arrows: {
        a:'⇦a⇨', b:'⇦b⇨', c:'⇦c⇨', d:'⇦d⇨', e:'⇦e⇨', f:'⇦f⇨', g:'⇦g⇨', h:'⇦h⇨', i:'⇦i⇨', j:'⇦j⇨', k:'⇦k⇨', l:'⇦l⇨', m:'⇦m⇨', n:'⇦n⇨', o:'⇦o⇨', p:'⇦p⇨', q:'⇦q⇨', r:'⇦r⇨', s:'⇦s⇨', t:'⇦t⇨', u:'⇦u⇨', v:'⇦v⇨', w:'⇦w⇨', x:'⇦x⇨', y:'⇦y⇨', z:'⇦z⇨',
        A:'⇦A⇨', B:'⇦B⇨', C:'⇦C⇨', D:'⇦D⇨', E:'⇦E⇨', F:'⇦F⇨', G:'⇦G⇨', H:'⇦H⇨', I:'⇦I⇨', J:'⇦J⇨', K:'⇦K⇨', L:'⇦L⇨', M:'⇦M⇨', N:'⇦N⇨', O:'⇦O⇨', P:'⇦P⇨', Q:'⇦Q⇨', R:'⇦R⇨', S:'⇦S⇨', T:'⇦T⇨', U:'⇦U⇨', V:'⇦V⇨', W:'⇦W⇨', X:'⇦X⇨', Y:'⇦Y⇨', Z:'⇦Z⇨',
        0:'⇦0⇨', 1:'⇦1⇨', 2:'⇦2⇨', 3:'⇦3⇨', 4:'⇦4⇨', 5:'⇦5⇨', 6:'⇦6⇨', 7:'⇦7⇨', 8:'⇦8⇨', 9:'⇦9⇨'
    }
};

export const THEME_PRESETS = {
    cyberpunk: { style: 'grid', font: 'monospace', barChar: '▓', barEmpty: '░', borderColor: '╭─ cyberpunk ╮', footerIcon: '🚀' },
    fantasy: { style: 'detailed', font: 'oldEnglish', barChar: '📜', barEmpty: ' ', borderColor: '╭─ 𝕲𝖗𝖎𝖒𝖔𝖎𝖗𝖊 ╮', footerIcon: '📜' },
    minimalist: { style: 'minimalist', font: 'sansSerif', barChar: '—', barEmpty: '·', borderColor: '╭─ minimalist ╮', footerIcon: '—' },
    default: { style: 'full', font: 'default', barChar: '█', barEmpty: '░', borderColor: '╭─╶「 *Dasbor* 」', footerIcon: '✨' }
};

// Path ke gambar default untuk menu. Ganti dengan path gambar Anda.
const MENU_PHOTO_PATH = path.join(process.cwd(), './assets/menu_image.png');

// Fungsi pembantu
export const helpers = {
    applyFont: (text, fontName = 'default') => {
        const map = FONT_MAPS[fontName];
        if (!map) return text;
        return text.replace(/[a-zA-Z0-9]/g, char => map[char] || char);
    },
    formatUptime: (startTime) => {
        const ms = Date.now() - startTime;
        const d = Math.floor(ms / 86400000);
        const h = Math.floor((ms % 86400000) / 3600000);
        const m = Math.floor((ms % 3600000) / 60000);
        const s = Math.floor((ms % 60000) / 1000); // [PENINGKATAN] Tambahkan detik
        return `${d}h ${h}j ${m}m ${s}d`;
    },
    formatBytes: (bytes) => {
        if (bytes === 0) return '0 B';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${['B','KB','MB','GB'][i]}`;
    },
    createBar: (val, max, theme) => {
        const len = 10;
        const p = Math.max(0, Math.min(1, val / max));
        const prog = Math.round(len * p);
        return `[${(theme.barChar || '█').repeat(prog)}${(theme.barEmpty || '░').repeat(len - prog)}]`;
    }
};

// Komponen UI (Widgets)
export const widgets = {
    buildPhoto: async (context) => {
        const { bot, m } = context;
        const userPrefs = bot.stateManager.state.registeredUsers[m.sender]?.menuPrefs || {};
        if (!userPrefs.photo) return null;
        try {
            return await fs.readFile(MENU_PHOTO_PATH);
        } catch (error) {
            bot.logger.warn(`[MENU] Gagal memuat gambar menu: ${MENU_PHOTO_PATH}`);
            return null;
        }
    },
    buildHeader: (context, theme) => {
        const { bot, m } = context;
        // [PERBAIKAN] Fallback untuk botName dan sock.user
        const botName = bot.config.botName || 'Bot';
        const botId = bot.sock.user?.id?.split(':')[0] || 'Unknown';
        return `${theme.borderColor.replace('Dasbor', `Dasbor Entitas ${botName}`)}\n` +
        `│ 🆔 *ID Entitas:* ${botId}\n`+
        `│ ⏱️ *Uptime:* ${helpers.formatUptime(bot.stateManager.state.startTime)}\n` +
        `│ 💾 *Memori:* ${helpers.formatBytes(process.memoryUsage().rss)}\n`;
    },
    buildCognitive: (context, theme) => {
        const { bot } = context;
        if (!bot.cognitiveCore?.stateVector) return '';
        const { C, P, I } = bot.cognitiveCore.stateVector;
        const health = (C + P + I) / 3 * 100;
        const display = (val, max) => `${helpers.createBar(val, max, theme)} ${(val).toFixed(1)}%`;
        // 'aiState' sekarang tersedia karena sudah diimpor
        return `│\n│ 🧠 *Homeostasis & Fisiologi*\n` +
        `│ ├─ *Mood:* ${aiState.mood}\n` +
        `│ ├─ *Energi:* ${display(aiState.energy, 100)}\n` +
        `│ └─ *Kelelahan:* ${display(aiState.fatigue, 100)}\n`;
    },
    buildActivity: (context) => {
        const { bot, m } = context;
        const stats = bot.stateManager.state.systemStats;
        const totalCmds = Object.values(stats.commandHits).reduce((a, b) => a + b, 0);
        const topCmds = Object.entries(stats.commandHits).sort(([,a],[,b])=>b-a).slice(0,3);
        let text = `│\n│ ⚡️ *Aktivitas Saraf* (Total: ${totalCmds})\n`;
        if (topCmds.length > 0) {
            topCmds.forEach((cmd, i) => text += `│  ${i === topCmds.length - 1 ? '└' : '├'}─ \`${m.prefix}${cmd[0]}\` (x${cmd[1]})\n`);
        } else {
            text += `│  └─ _Belum ada aktivitas tercatat._\n`;
        }
        return text + `╰─╶`;
    },
    buildCommands: (context, commands, theme) => {
        const { m } = context;
        let text = `\n\n${theme.borderColor.replace('Dasbor', 'Perintah')}\n`;
        commands.forEach(cmd => text += `│ • \`${m.prefix}${cmd.usage || cmd.name}\`\n`);
        return text + `╰─╶`;
    },
    buildFooter: (context, session, theme) => {
        const totalPages = session.paginatedCommands.length;
        const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        let navText = `| Balas 'stop' untuk keluar.`;
        if (totalPages > 1) {
            navText = `| Balas 'n' (next), 'p' (prev), atau nomor halaman.`;
        }
        return `\n\n╭─╶「 ${theme.footerIcon} 」\n` +
        `│ Halaman ${session.currentPage}/${totalPages} ${navText}\n` +
        `│ Ketik \`.menu set\` untuk kustomisasi\n` +
        `╰─╶ [ ${time} WIB ]`;
    }
};
