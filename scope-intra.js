var SI={};
var SIM={};
function siBars(s){var a=SI[s];if(!a)return null;var t=a[0],dT=a[1],dC=a[2],oO=a[3],hO=a[4],lO=a[5],V=a[6];
var out=[],c=0;for(var i=0;i<dC.length;i++){c=i===0?dC[0]:c+dC[i];if(i>0)t+=dT[i-1]*60;
out.push([t,c+oO[i],c+hO[i],c+lO[i],c,V[i]*1e3]);}return out;}
