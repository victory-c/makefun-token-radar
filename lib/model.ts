// SPDX-License-Identifier: MIT
// Original model. All valuations are conditional estimates, never token or reward forecasts.
export const MODEL = {
  version: 'Harbor / 1.0', prior: 0.6, shrinkage: 5, ratioMin: 0.08, ratioMax: 4,
  growthClamp: 35, growthWeight: 0.45, maturityWeight: 0.25,
  description: 'TVL × category peer multiple × bounded 7d momentum × tracking maturity. Peer ratios are shrunk toward the global median. No protocol-name valuation overrides.'
};
export function quantile(values: number[], q: number) {
  const a = [...values].sort((x,y)=>x-y);
  if (!a.length) return MODEL.prior;
  const i = (a.length-1)*q, l = Math.floor(i);
  return a[l]+(a[Math.ceil(i)]-a[l])*(i-l);
}
const clamp = (n:number, a:number, b:number)=>Math.max(a,Math.min(b,n));
const excludedCategory = /^(Bridge|Canonical Bridge|Cross Chain Bridge|Liquid Staking|Liquid Restaking|Restaked BTC|CEX|Stablecoin Wrapper)$/;
export function productLike(p:any) {
  return excludedCategory.test(p.category||'') || /\b(wrapped|staked|staking)\b|\s[vV]?\d+\.?(\d+)?$/.test(p.name) || /^(Binance|Coinbase|Bybit|Kraken|Bitget|OKX|Bitfinex|Gemini)\b/i.test(p.name);
}
export function accessType(p:any) {
  if (/Risk Curators|RWA|Onchain Capital Allocator|CeDeFi|CEX|Uncollateralized/.test(p.category||'')) return 'Verify access';
  if (/Chain|Decentralized AI|AI Agents|Payments|Crypto Card|DOR/.test(p.category||'')) return 'Research first';
  return 'Permissionless unverified';
}
export function executionChain(p:any) {
  // Prefer a recorded lower-fee network; never invent chain support.
  const priority=['Base','Arbitrum','Optimism','Polygon','Solana','Avalanche','BSC','Linea','Scroll','Mantle'];
  return priority.find(chain=>p.chains?.includes(chain))||p.chains?.[0]||'the documented network';
}
export function farmPlan(p:any) {
  const chain = executionChain(p);
  const expensive = chain==='Ethereum';
  const fees = expensive ? '$5–25' : '$1–5';
  const label = `${p.name} (${p.category||'uncategorized'})`;
  const access = accessType(p);
  let action = `If public deposits are documented, test a $25–50 deposit into one supported asset on ${chain}; avoid leverage, borrowing and recursive positions.`;
  let risks = 'contract exploits, depeg, withdrawal queues and changing fees';
  if (/Dexs|Liquidity Manager/.test(p.category||'')) {
    action=`If a verified public interface exists on ${chain}, test one $10–20 spot swap with slippage capped at 0.5%; do not provide a volatile LP solely for an unannounced reward.`;
    risks='slippage, malicious approvals, impermanent loss if you later LP, and contract exploits';
  } else if (/Derivatives|Options|Prediction|Leveraged|Basis/.test(p.category||'')) {
    action=`Use ${p.name}'s documented paper-trading or read-only market view if available; do not open a leveraged position to chase an unconfirmed distribution. If no safe simulation exists, skip capital actions.`;
    risks='liquidation, funding charges, oracle failure and contract exploits';
  } else if (/Stablecoin|CDP|Reserve Currency/.test(p.category||'')) {
    action=`Inspect ${p.name}'s collateral and redemption documentation on ${chain}; if direct redemption and access are verified, a $25 test mint/redeem is optional. Never borrow to mint for points.`;
    risks='depeg, collateral shortfall, redemption restrictions and liquidation';
  } else if (/Restaking|Staking Pool/.test(p.category||'')) {
    action=`Read ${p.name}'s slashing and unbonding terms on ${chain}. Only if public participation and an acceptable exit are confirmed, test at most $25; otherwise remain observation-only.`;
    risks='slashing, unbonding delays, correlated validator failure and contract exploits';
  } else if (access==='Verify access') {
    action=`Check whether ${p.name} exposes a public vault or only institutional mandates on ${chain}; read eligibility, KYC, underlying vault manager and redemption terms. No confirmed retail access means watch only, $0 deposited.`;
    risks='access restrictions, counterparty exposure, vault-manager discretion and illiquidity';
  } else if (access==='Research first') {
    action=`Read ${p.name}'s documented participation roles on ${chain}; inspect a public explorer or test environment if offered. Do not assume that operating a node, bridging or spending qualifies for any reward.`;
    risks='unsupported participation assumptions, operating costs and opaque eligibility';
  }
  return [
    `Research ${label}: locate its official documentation independently and cross-check contract addresses against a reputable explorer on ${chain}. The snapshot supplies no verified app URL; never use search ads. Allow 15–20 minutes, $0.`,
    `Before any interaction, verify public access, supported assets and current incentive terms. ${p.symbol||p.gecko_id?'A token identifier is already recorded; do not assume a pre-token allocation.':'No token identifier is recorded in this snapshot; this is not evidence of a future token or airdrop.'} Observation costs $0.`,
    action + ' Allow 10–15 minutes for the first test; these are hypothetical instructions, not an executed transaction.',
    `Budget for ${chain}: observation-only requires $0 and no wallet. An optional capital test is capped at $50 principal plus ${fees} estimated round-trip network fees, not a live quote; abort if fees exceed the cap or any terms are unclear.`,
    `Review once weekly for 4 weeks, 5 minutes per review: record the date, public eligibility updates and any optional transaction receipt. Do not wash-trade, split identities or repeat transactions merely to manufacture activity.`,
    `Exit plan for ${p.name}: verify withdrawal or redemption before entering; stop for ${risks}. Withdraw the test principal when the documented exit permits, then revoke unnecessary approvals. No guaranteed distribution, yield or principal recovery.`
  ];
}
export function buildRadar(snapshot:any) {
  if (!Array.isArray(snapshot.protocols)||!Array.isArray(snapshot.watchlist)||!Number.isFinite(Date.parse(snapshot.as_of))) throw Error('Invalid snapshot shape/date');
  const watch = new Set(snapshot.watchlist);
  const protocols = snapshot.protocols;
  if (new Set(protocols.map((p:any)=>p.slug)).size!==protocols.length) throw Error('Duplicate snapshot slug');
  for (const slug of watch) if (!protocols.some((p:any)=>p.slug===slug)) throw Error('Missing watchlist protocol');
  const hasToken = (p:any)=>Boolean(p.symbol||p.gecko_id||p.mcap_usd>0);
  // Stablecoin liabilities and exchange balances are not useful token-equity comparables.
  const peers = protocols.filter((p:any)=>hasToken(p)&&p.mcap_usd>0&&p.tvl_usd>0&&!/Stablecoin|CDP|CEX|Bridge|Staking|Restaking|Restaked|Reserve Currency|Anchor BTC/.test(p.category||''))
    .map((p:any)=>({...p,ratio:clamp(p.mcap_usd/p.tvl_usd,MODEL.ratioMin,MODEL.ratioMax)}));
  const globalMedian = quantile(peers.map((p:any)=>p.ratio),.5);
  const candidates = protocols.filter((p:any)=>watch.has(p.slug)||(!hasToken(p)&&!productLike(p)));
  const rows = candidates.map((p:any)=>{
    const group=peers.filter((x:any)=>x.category===p.category);
    const weight=group.length/(group.length+MODEL.shrinkage);
    const multiple = quantile(group.map((x:any)=>x.ratio),.5)*weight+globalMedian*(1-weight);
    const rawDays=p.listed_at?Math.floor((Date.parse(snapshot.as_of)-Date.parse(p.listed_at))/86400000):NaN;
    const age=Number.isFinite(rawDays)?Math.max(0,rawDays):null;
    const growth=Number.isFinite(p.change_7d)?p.change_7d:null;
    const momentum=1+MODEL.growthWeight*clamp((growth??0)/100,-.35,.35);
    const maturity=1+MODEL.maturityWeight*Math.log1p(Math.min(age??0,1825)/180)/Math.log1p(1825/180);
    const value=Math.max(1,Math.round(p.tvl_usd*multiple*momentum*maturity));
    const spread=group.length>=5?.45:.65;
    const flags=[...(growth===null?['7d growth missing']:[]),...(age===null?['Tracking date missing']:[]),...(group.length<5?['Sparse comparables']:[]),...(productLike(p)?['Related-product review']:[]),...(hasToken(p)?['Token record conflict']:[])];
    return {...p,category:p.category||'Uncategorized',rank:0,implied_value_usd:value,low:Math.round(value*(1-spread)),high:Math.round(value*(1+spread)),watch:watch.has(p.slug),age_days:age,growth,multiple,momentum,maturity,peer_count:group.length,plan_chain:executionChain(p),access:accessType(p),flags,farm_steps:farmPlan(p)};
  }).sort((a:any,b:any)=>b.implied_value_usd-a.implied_value_usd||a.slug.localeCompare(b.slug));
  rows.forEach((r:any,i:number)=>r.rank=i+1);
  if(rows.length<100||rows.length>4000) throw Error('Board count outside gate');
  const live=protocols.filter((p:any)=>hasToken(p)).map((p:any)=>({...p,category:p.category||'Uncategorized'})).sort((a:any,b:any)=>b.tvl_usd-a.tvl_usd);
  const excluded=protocols.filter((p:any)=>!hasToken(p)&&!candidates.some((r:any)=>r.slug===p.slug)).length;
  return {as_of:snapshot.as_of,source:snapshot.source,floor_usd:snapshot.floor_usd,model:{...MODEL,globalMedian,peer_count:peers.length},rows,live,excluded,watch_count:watch.size};
}
export function assertBoard(radar:any,snapshot:any) {
  const seen=new Set(); let last=Infinity;
  for (const [i,r] of radar.rows.entries()) {
    if(seen.has(r.slug)||r.rank!==i+1||!Number.isSafeInteger(r.implied_value_usd)||r.implied_value_usd<1||r.implied_value_usd>1e14||r.implied_value_usd>last) throw Error('Invalid board rank/value');
    if(!snapshot.protocols.some((p:any)=>p.slug===r.slug)) throw Error('Invented protocol');
    if(r.farm_steps.length<3||r.farm_steps.length>12||r.farm_steps.some((s:string)=>s.trim().length<20||s.trim().length>600)) throw Error('Invalid farm plan: '+r.slug);
    seen.add(r.slug);last=r.implied_value_usd;
  }
  if(!snapshot.watchlist.every((s:string)=>seen.has(s))) throw Error('Watchlist coverage failed');
}
