window.ModoMedia=(()=>{const ext=/\.(png|jpe?g|gif)$/i;
function normalize(src){let s=String(src||'').trim();if(!s)return'';if(/^https?:\/\//i.test(s)||s.startsWith('data:')||s.startsWith('blob:')||s.startsWith('/api/media'))return s;s='/'+s.replace(/^\/+/, '');return ext.test(s)?s.replace(ext,'.webp'):s}
function absolute(src){return normalize(src)}
function url(src){return absolute(src)}
return{url,absolute}})();