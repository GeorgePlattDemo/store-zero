/** Bounded simulated source-record gate. No persistence or external commercial side effects. */
import '../contracts/commercial-sequence.js';
const contract=globalThis.STBCommercialSequence;
export const COMMERCIAL_PROTOCOL='STORE-ZERO-COMMERCIAL-EVIDENCE-1';
export async function evaluateCommercialRequest(request){
 const refused=reason=>({status:'REFUSED',reasonCodes:[reason],evidenceClass:'SIMULATED',physicalAuthority:false,paymentAuthority:false});
 if(!request||typeof request!=='object'||Array.isArray(request)||Object.keys(request).sort().join(',')!=='events,expectedSequence,links,sourceEvent,streamId'||!Array.isArray(request.events)||request.events.length>1000)return refused('COMMERCIAL_REQUEST_SHAPE');
 try{
  if(!await contract.verify(request.events))return refused('COMMERCIAL_PRIOR_EVIDENCE_ALTERED');
  const stream=contract.create({streamId:request.streamId,links:request.links});
  for(const stored of request.events){const {hash,previousHash,...source}=stored;await stream.recordEvent(source,source.expectedPreviousSequence);}
  const event=await stream.recordEvent(request.sourceEvent,request.expectedSequence);
  return {status:'RECORDED',event,state:stream.deriveTransactionState(),evidenceClass:'SIMULATED',physicalAuthority:false,paymentAuthority:false};
 }catch(error){return refused(error.message);}
}
