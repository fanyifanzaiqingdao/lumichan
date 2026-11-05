const templates={
 ja:{account:'{name}のアカウントを入力してください。',day:'{n}日目',image:'画像{n}を表示',slide:'{total}枚中{n}枚目',view:'{name}を見る',policy:'{name}の予約条件',from:'USD {n}〜',trip:'USD {n} / 旅行',days:'{n}日',years:'{n}年',people:'{n}名',remove:'「{name}」を削除しますか？',irreversible:'この操作は取り消せません。'},
 es:{account:'Introduce tu cuenta de {name}.',day:'Día {n}',image:'Mostrar imagen {n}',slide:'{n} de {total}',view:'Ver {name}',policy:'Condiciones de reserva de {name}',from:'Desde USD {n}',trip:'USD {n} / viaje',days:'{n} días',years:'{n} años',people:'{n} personas',remove:'¿Eliminar «{name}»?',irreversible:'Esta acción no se puede deshacer.'},
 'zh-TW':{account:'請輸入你的 {name} 帳號。',day:'第 {n} 天',image:'顯示第 {n} 張圖片',slide:'第 {n} 張，共 {total} 張',view:'查看{name}',policy:'{name}預訂政策',from:'USD {n} 起',trip:'USD {n} / 次行程',days:'{n} 天',years:'{n} 年',people:'{n} 人',remove:'確定刪除「{name}」？',irreversible:'此操作無法復原。'},
 ko:{account:'{name} 계정을 입력해 주세요.',day:'{n}일차',image:'이미지 {n} 보기',slide:'전체 {total}개 중 {n}번째',view:'{name} 보기',policy:'{name} 예약 정책',from:'USD {n}부터',trip:'USD {n} / 여행',days:'{n}일',years:'{n}년',people:'{n}명',remove:'「{name}」을 삭제하시겠습니까?',irreversible:'이 작업은 되돌릴 수 없습니다.'},
 fr:{account:'Indiquez votre compte {name}.',day:'Jour {n}',image:'Afficher l’image {n}',slide:'{n} sur {total}',view:'Voir {name}',policy:'Conditions de réservation de {name}',from:'À partir de USD {n}',trip:'USD {n} / voyage',days:'{n} jours',years:'{n} ans',people:'{n} personnes',remove:'Supprimer « {name} » ?',irreversible:'Cette action est irréversible.'},
 de:{account:'Bitte geben Sie Ihr {name}-Konto an.',day:'Tag {n}',image:'Bild {n} anzeigen',slide:'{n} von {total}',view:'{name} ansehen',policy:'Buchungsbedingungen für {name}',from:'Ab USD {n}',trip:'USD {n} / Reise',days:'{n} Tage',years:'{n} Jahre',people:'{n} Personen',remove:'„{name}“ löschen?',irreversible:'Diese Aktion kann nicht rückgängig gemacht werden.'},
 it:{account:'Inserisci il tuo account {name}.',day:'Giorno {n}',image:'Mostra immagine {n}',slide:'{n} di {total}',view:'Vedi {name}',policy:'Condizioni di prenotazione di {name}',from:'Da USD {n}',trip:'USD {n} / viaggio',days:'{n} giorni',years:'{n} anni',people:'{n} persone',remove:'Eliminare «{name}»?',irreversible:'Questa operazione non può essere annullata.'},
}
const fill=(template,values)=>template.replace(/\{(\w+)\}/g,(_,key)=>values[key]??'')
export function dynamicText(value,language,translate){
 const copy=templates[language];if(!copy)return value
 const text=value.trim();let match
 const singular={es:{days:'{n} día',years:'{n} año',people:'{n} persona'},fr:{days:'{n} jour',years:'{n} an',people:'{n} personne'},de:{days:'{n} Tag',years:'{n} Jahr',people:'{n} Person'},it:{days:'{n} giorno',years:'{n} anno',people:'{n} persona'}}[language]||{}
 const count=(key,n)=>fill(n==='1'&&singular[key]?singular[key]:copy[key],{n})
 if((match=text.match(/^Enter your (.+) account\.$/)))return fill(copy.account,{name:translate(match[1])})
 if((match=text.match(/^Day (\d+)$/)))return fill(copy.day,{n:match[1]})
 if((match=text.match(/^Show image (\d+)$/)))return fill(copy.image,{n:match[1]})
 if((match=text.match(/^(\d+) of (\d+)$/)))return fill(copy.slide,{n:match[1],total:match[2]})
 if((match=text.match(/^View (.+)$/)))return fill(copy.view,{name:translate(match[1])})
 if(text.endsWith(' booking policy'))return fill(copy.policy,{name:translate(text.slice(0,-15))})
 if((match=text.match(/^确定删除(?:向导|线索)?「([\s\S]*)」？(此操作不可撤销。)?$/)))return fill(copy.remove,{name:match[1]})+(match[2]?' '+copy.irreversible:'')
 return value.replace(/\bFrom USD\s*([\d,]+)/g,(_,n)=>fill(copy.from,{n})).replace(/\bUSD\s*([\d,]+)\s*\/\s*trip/g,(_,n)=>fill(copy.trip,{n})).replace(/\b(\d+) days?\b/gi,(_,n)=>count('days',n)).replace(/\b(\d+) years?\b/gi,(_,n)=>count('years',n)).replace(/\b(\d+(?:[-–]\d+)?) (?:people|person|travelers)\b/g,(_,n)=>count('people',n))
}
