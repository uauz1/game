import { selectSmart, type ContentMeta } from './contentIntelligence';

export function drawWithoutRepeats<T>(game:string,pool:T[],count:number,getId:(item:T)=>string,getMeta?:(item:T)=>ContentMeta){
  return selectSmart(game,pool,count,getId,getMeta);
}
