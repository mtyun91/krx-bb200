/* CPU-heavy research runs away from chart gestures. */
importScripts('engine.js');
self.onmessage=function(event){try{const {series,settings}=event.data;self.postMessage({ok:true,result:PartisanEngine.backtest(series,settings)});}catch(error){self.postMessage({ok:false,error:error.message});}};
