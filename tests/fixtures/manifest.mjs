// Test/example authoring only. Runtime Store never invents a System manifest.
export function testManifest(requestType,d){
 const boards=requestType==='USER_DEFINED_BOARD_V1'?d.parts??[]:(d.cutPackages??[]).flatMap(p=>p.parts??[]);
 return {jobId:d.configurationId,revision:d.configurationVersion,boardPartIds:boards.map(p=>p.partId),sheetPackageIds:requestType==='SHEET_PACKAGE_V1'?[d.configurationId]:[],featureIds:requestType==='SHEET_PACKAGE_V1'?(d.features??[]).map(f=>f.featureId):boards.flatMap(p=>[...(p.features??p.spots??[]),...(p.edgeProfiles??[])].map(f=>f.featureId)),items:(d.itemLines??[]).map(i=>({lineId:i.lineId,qty:i.qty})),unresolvedRequirements:[...(d.unresolvedConditions??[])]};
}
export const identifiedRequest=(requestType,demand,requestId='TEST')=>({requestType,requestId,demand,manifest:testManifest(requestType,demand)});
