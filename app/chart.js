(function(root){'use strict';
class FlowChart{
 constructor(canvas,options={}){this.el=canvas;this.ctx=canvas.getContext('2d');this.options=options;this.bars=[];this.analysis=[];this.count=160;this.end=0;this.selected=null;this.zones=true;this.markMode=false;this.drag=null;this.annotations=[];
 this.observer=new ResizeObserver(()=>this.schedule());this.observer.observe(canvas.parentElement);
 canvas.addEventListener('wheel',e=>{e.preventDefault();this.zoom(e.deltaY<0?-.15:.15);},{passive:false});
 canvas.addEventListener('pointerdown',e=>{if(!this.bars.length)return;canvas.setPointerCapture(e.pointerId);const i=this.index(e);this.drag={x:e.clientX,end:this.end,a:i,b:i,mark:e.shiftKey||this.markMode,moved:false};});
 canvas.addEventListener('pointermove',e=>{if(this.drag){const d=this.drag;d.moved=d.moved||Math.abs(e.clientX-d.x)>4;if(d.mark)d.b=this.index(e);else this.end=Math.max(Math.min(this.count,this.bars.length),Math.min(this.bars.length,d.end-Math.round((e.clientX-d.x)/this.geom.step)));this.schedule();}else this.options.hover?.(this.index(e),e);});
 canvas.addEventListener('pointerup',e=>{const d=this.drag;this.drag=null;if(!d)return;if(d.mark&&Math.abs(d.b-d.a)>=1)this.options.range?.(Math.min(d.a,d.b),Math.max(d.a,d.b));else if(!d.moved){this.selected=this.index(e);this.options.select?.(this.selected);}this.schedule();});
 canvas.addEventListener('pointerleave',()=>this.options.hover?.(null));canvas.addEventListener('pointercancel',()=>{this.drag=null;this.schedule();});
 canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();this.selected=Math.max(0,Math.min(this.bars.length-1,(this.selected??this.bars.length-1)+(e.key==='ArrowLeft'?-1:1)));if(this.selected>=this.end)this.end=this.selected+1;if(this.selected<this.end-this.count)this.end=Math.min(this.bars.length,this.selected+this.count);this.options.select?.(this.selected);this.schedule();});
 }
 setData(bars,analysis=[],opts={}){this.bars=bars;this.analysis=analysis;this.annotations=opts.annotations||[];this.minute=!!opts.minute;this.end=bars.length;this.selected=null;this.schedule();}
 focus(from,to){const a=this.bars.findIndex(b=>b.t>=from),b=this.bars.findIndex(b=>b.t>to);if(a<0)return;const end=b<0?this.bars.length:b;this.count=Math.max(50,Math.min(700,end-a+35));this.end=Math.min(this.bars.length,end+12);this.selected=a;this.schedule();this.options.select?.(a);}
 latest(){this.end=this.bars.length;this.selected=null;this.schedule();this.options.select?.(null);}
 zoom(delta){this.count=Math.round(Math.max(35,Math.min(700,this.count*(1+delta))));this.schedule();}
 index(e){if(!this.geom)return 0;const r=this.el.getBoundingClientRect();return Math.max(0,Math.min(this.bars.length-1,Math.floor((e.clientX-r.left-this.geom.left)/this.geom.step)+this.geom.start));}
 schedule(){if(this.frame)return;this.frame=requestAnimationFrame(()=>{this.frame=null;this.draw();});}
 draw(){
 const rect=this.el.getBoundingClientRect(),w=rect.width,h=rect.height;if(!w||!h)return;
 const dpr=devicePixelRatio||1;this.el.width=Math.round(w*dpr);this.el.height=Math.round(h*dpr);const g=this.ctx;g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,w,h);if(!this.bars.length)return;
 const end=Math.min(this.end||this.bars.length,this.bars.length),start=Math.max(0,end-this.count),visible=this.bars.slice(start,end),left=6,right=w<500?49:62,top=34,bottom=h-96,plot=w-left-right,step=plot/visible.length;
 const low=Math.min(...visible.map(b=>b.l)),high=Math.max(...visible.map(b=>b.h)),padding=Math.max((high-low)*.11,high*.015),ymin=low-padding,ymax=high+padding;
 const x=i=>left+(i-start+.5)*step,y=p=>top+(ymax-p)/(ymax-ymin)*(bottom-top);this.geom={start,end,left,step,x,y,bottom};g.font='10px Segoe UI, Malgun Gothic';
 const E=root.PartisanEngine;
 if(this.zones&&!this.minute){
  const segs=E.segments(this.analysis,start).filter(s=>s.start<end);
  for(const s of segs){const def=E.PHASES[s.phase],a=Math.max(start,s.start),b=Math.min(end-1,s.end),xx=x(a)-step/2,ww=(b-a+1)*step;g.fillStyle=def.color+'0c';g.fillRect(xx,top,ww,bottom-top);g.fillStyle=def.color+'90';g.fillRect(xx,top-12,ww,3);
   if(ww>85){g.fillStyle=def.color;g.font='9px Segoe UI, Malgun Gothic';g.fillText(def.name,xx+5,top-17,ww-8);}
  }
 }
 g.font='10px Segoe UI, Malgun Gothic';g.strokeStyle='#e9edf0';g.lineWidth=1;g.textAlign='left';
 for(let k=0;k<5;k++){const price=ymin+(ymax-ymin)*k/4,yy=y(price);g.beginPath();g.moveTo(left,yy);g.lineTo(w-right,yy);g.stroke();g.fillStyle='#9aa5ac';g.fillText(Math.round(price).toLocaleString(),w-right+7,yy+3);}
 const line=(field,color,dashed=false)=>{g.strokeStyle=color;g.lineWidth=field==='mid'?1.5:1.2;g.setLineDash(dashed?[5,4]:[]);g.beginPath();let begun=false;visible.forEach((b,j)=>{const value=b[field];if(value==null||((field==='upper'||field==='lower'||field==='mid')&&!b.ready)){begun=false;return;}const yy=y(value);if(!begun){g.moveTo(x(start+j),yy);begun=true;}else g.lineTo(x(start+j),yy);});};
 // Clip indicator paths so long-period bands cannot overdraw volume and legends.
 g.save();g.beginPath();g.rect(left,top,plot,bottom-top);g.clip();
 for(const [field,color,dashed]of [['upper','#bc797a',true],['lower','#88a5c5',true],['mid','#647780',false],['ma20','#c9a760',false],['ma5','#ad98c9',false]]){line(field,color,dashed);g.stroke();}g.setLineDash([]);
 const candleWidth=Math.max(1,Math.min(8,step*.64));visible.forEach((b,j)=>{g.strokeStyle=g.fillStyle=b.c>=b.o?'#c5615e':'#5d82b0';const xx=x(start+j);g.beginPath();g.moveTo(xx,y(b.h));g.lineTo(xx,y(b.l));g.stroke();g.fillRect(xx-candleWidth/2,Math.min(y(b.o),y(b.c)),candleWidth,Math.max(1,Math.abs(y(b.o)-y(b.c))));
  if(!this.minute&&this.analysis[start+j]?.signal){g.fillStyle='#087f77';g.beginPath();g.moveTo(xx,y(b.l)+6);g.lineTo(xx-4,y(b.l)+13);g.lineTo(xx+4,y(b.l)+13);g.closePath();g.fill();}
 });
 const selected=this.selected??end-1,a=this.analysis[selected];
 if(!this.minute&&selected>=start&&selected<end&&a?.support){g.strokeStyle='#b98a4a';g.setLineDash([3,4]);g.beginPath();g.moveTo(x(Math.max(start,selected-15)),y(a.support));g.lineTo(x(selected),y(a.support));g.stroke();g.setLineDash([]);g.fillStyle='#a57b42';g.font='9px Segoe UI, Malgun Gothic';g.fillText('구조 지지',x(Math.max(start,selected-15)),y(a.support)-5);}
 g.restore();
 // Sparse action labels explain the chart without covering every candle.
 if(!this.minute){const signals=[];for(let i=start;i<end;i++)if(this.analysis[i]?.signal)signals.push(i);
  for(const i of signals.slice(-3)){const label=this.analysis[i].recovery?'회복 · 재진입 검토':'준비된 돌파 · 진입 검토';g.font='10px Segoe UI, Malgun Gothic';const width=g.measureText(label).width+16,xx=Math.min(w-right-width,Math.max(left,x(i)-width/2)),yy=Math.max(top+12,y(this.bars[i].h)-38);
   g.fillStyle='#087f77';g.fillRect(xx,yy,width,21);g.fillStyle='#fff';g.fillText(label,xx+8,yy+14);g.strokeStyle='#087f77';g.beginPath();g.moveTo(x(i),yy+21);g.lineTo(x(i),y(this.bars[i].h)-4);g.stroke();
  }
 }
 // User ranges are references, never strategy labels.
 for(const note of this.annotations){const a=this.bars.findIndex(b=>b.t>=note.from),b=this.bars.findIndex(b=>b.t>=note.to);if(a<0||b<start||a>=end)continue;const xx=x(Math.max(a,start))-step/2,ww=(Math.min(end-1,b)-Math.max(a,start)+1)*step;g.fillStyle='#7964a015';g.fillRect(xx,top,ww,bottom-top);g.strokeStyle='#9682b4';g.setLineDash([3,3]);g.strokeRect(xx,top,ww,bottom-top);g.setLineDash([]);}
 const volumeTop=bottom+18,volumeBottom=h-23,maxV=Math.max(...visible.map(b=>b.v),1);g.fillStyle='#9da7af';g.font='9px Segoe UI, Malgun Gothic';g.fillText('거래량',left,volumeTop+3);
 visible.forEach((b,j)=>{g.fillStyle=b.c>=b.o?'#c5615e70':'#5d82b070';const vh=b.v/maxV*(volumeBottom-volumeTop-13);g.fillRect(x(start+j)-candleWidth/2,volumeBottom-vh,candleWidth,vh);});
 g.fillStyle='#8c99a3';g.font='9px Segoe UI, Malgun Gothic';for(let j=0;j<visible.length;j+=Math.ceil(visible.length/6)){const t=visible[j].t,txt=this.minute?t.slice(8,10)+':'+t.slice(10,12):t.slice(2,4)+'.'+t.slice(4,6)+'.'+t.slice(6,8);g.fillText(txt,x(start+j)-16,h-5);}
 if(this.selected!=null&&this.selected>=start&&this.selected<end){g.strokeStyle='#627e8d';g.setLineDash([3,4]);g.beginPath();g.moveTo(x(this.selected),top);g.lineTo(x(this.selected),volumeBottom);g.stroke();g.setLineDash([]);g.fillStyle='#19323d';g.beginPath();g.arc(x(this.selected),y(this.bars[this.selected].c),3,0,Math.PI*2);g.fill();}
 if(this.drag?.mark){const a=Math.min(this.drag.a,this.drag.b),b=Math.max(this.drag.a,this.drag.b);g.fillStyle='#087f7725';g.fillRect(x(a)-step/2,top,(b-a+1)*step,bottom-top);}
 }
}
root.FlowChart=FlowChart;
})(globalThis);
