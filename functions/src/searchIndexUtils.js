function computeQualityScore(listing){
  const photos = Math.min((listing.images||[]).length,10)/10;
  const desc = Math.min((listing.description||'').length,600)/600;
  const amenities = Math.min((listing.amenities||[]).length,8)/8;
  return +(0.55*photos + 0.30*desc + 0.10*amenities).toFixed(3);
}
function computeRecencyScore(listing){
  const last = listing.updatedAt || listing.createdAt || Date.now();
  const hours = Math.max(1, (Date.now() - new Date(last).getTime())/3600000);
  const decay = 240;
  return +(Math.exp(-hours/decay)).toFixed(3);
}
function computeFinalScore(listing, agentTrust=0.5){
  const q = computeQualityScore(listing);
  const r = computeRecencyScore(listing);
  const base = 0.33*r + 0.33*q + 0.20*agentTrust;
  return +base.toFixed(3);
}
module.exports = { computeQualityScore, computeRecencyScore, computeFinalScore };
