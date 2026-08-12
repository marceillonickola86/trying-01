export type Part={id:string;name:string;width:number;height:number;qty:number};
export type Placement={x:number;y:number;width:number;height:number;rotated:boolean;part:Part;index:number};
export type Offcut={x:number;y:number;width:number;height:number};
export type SheetResult={placements:Placement[];offcuts:Offcut[];usedArea:number;wasteArea:number};
type Free={x:number;y:number;width:number;height:number};
function score(r:Free,w:number,h:number){if(w>r.width||h>r.height)return Infinity;return Math.min(r.width-w,r.height-h)*100000+Math.max(r.width-w,r.height-h)}
function prune(rs:Free[]){return rs.filter(r=>r.width>=30&&r.height>=30).filter((a,i,arr)=>!arr.some((b,j)=>i!==j&&a.x>=b.x&&a.y>=b.y&&a.x+a.width<=b.x+b.width&&a.y+a.height<=b.y+b.height))}
export function optimize(parts:Part[],sheetW:number,sheetH:number,margin:number):SheetResult[]{
 const expanded:Part[]=[]; for(const p of parts) for(let i=0;i<Math.max(0,p.qty);i++) expanded.push({...p,qty:1,id:p.id+"-"+i});
 expanded.sort((a,b)=>b.width*b.height-a.width*a.height);
 const sheets:{placements:Placement[];free:Free[]}[]=[];
 for(const p of expanded){
  let bs=-1,bi=-1,br=false,bscore=Infinity;
  for(let s=0;s<sheets.length;s++) for(let r=0;r<sheets[s].free.length;r++){
   const f=sheets[s].free[r]; const a=score(f,p.width,p.height); if(a<bscore){bscore=a;bs=s;bi=r;br=false}
   if(p.width!==p.height){const b=score(f,p.height,p.width);if(b<bscore){bscore=b;bs=s;bi=r;br=true}}
  }
  if(bs<0){sheets.push({placements:[],free:[{x:margin,y:margin,width:sheetW-2*margin,height:sheetH-2*margin}]});bs=sheets.length-1;bi=0}
  const sh=sheets[bs], f=sh.free.splice(bi,1)[0], w=br?p.height:p.width, h=br?p.width:p.height;
  sh.placements.push({x:f.x,y:f.y,width:w,height:h,rotated:br,part:p,index:sh.placements.length});
  const rw=f.width-w-margin,rh=f.height-h-margin;
  if(rw>0)sh.free.push({x:f.x+w+margin,y:f.y,width:rw,height:h});
  if(rh>0)sh.free.push({x:f.x,y:f.y+h+margin,width:f.width,height:rh});
  sh.free=prune(sh.free);
 }
 return sheets.map(sh=>{const usedArea=sh.placements.reduce((a,p)=>a+p.width*p.height,0);return{placements:sh.placements,offcuts:sh.free.filter(r=>r.width>=100&&r.height>=100).slice(0,8),usedArea,wasteArea:sheetW*sheetH-usedArea}})
}