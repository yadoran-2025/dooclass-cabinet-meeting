const styles = {
  a1: ['short', '#3b3538', '#7da7d0', '#f0c4a0', 'scarf'],
  a2: ['bob', '#704631', '#e7a6a1', '#deb08b', 'bow'],
  a3: ['bowl', '#343e47', '#e3b647', '#f2c89f', 'glasses'],
  a4: ['bun', '#573b32', '#b6a3d4', '#f0c4a0', 'overalls'],
  a5: ['curls', '#3e302e', '#e7bb96', '#bb8365', 'headband'],
  a6: ['short', '#85634a', '#86b9a4', '#f2c89f', 'cap'],
  a7: ['pony', '#4b3937', '#d7a1b8', '#deb08b', 'headphones'],
  b1: ['side', '#8c5c3d', '#c4ad7a', '#f2c89f', 'glasses'],
  b2: ['bob', '#363c49', '#94bec4', '#deb08b', 'beret'],
  b3: ['curls', '#634536', '#e8a788', '#bb8365', 'overalls'],
  b4: ['pony', '#85634a', '#aca2c8', '#f0c4a0', 'bow'],
  b5: ['short', '#413c38', '#b4c78e', '#deb08b', 'beanie'],
  president: ['side', '#4d3e36', '#6688a8', '#f0c4a0', 'scarf'],
  expert: ['bob', '#775543', '#e5d3ae', '#f2c89f', 'beret'],
  expert2: ['pony', '#363c49', '#99b9cf', '#deb08b', 'headband'],
  expert3: ['curls', '#634536', '#b4c78e', '#bb8365', 'glasses'],
  expert4: ['bun', '#413c38', '#d8acbd', '#deb08b', 'headband'],
  expert5: ['side', '#775543', '#93bba8', '#f2c89f', 'cap'],
  expert6: ['short', '#363c49', '#d9bd81', '#bb8365', 'headphones'],
};

export function pixelArt(p) {
  const appearanceId = p?.appearanceId ?? p?.id;
  if (!styles[appearanceId]) throw new RangeError('캐릭터가 없는 인물이에요.');
  const [haircut, hair, shirt, skin, accessory] = styles[appearanceId];
  const hairShape = {
    short: `<rect x="4" y="5" width="5" height="2" fill="${hair}"/>`,
    bob: `<rect x="3" y="9" width="2" height="5" fill="${hair}"/><rect x="11" y="9" width="2" height="5" fill="${hair}"/><rect x="4" y="5" width="7" height="2" fill="${hair}"/>`,
    bowl: `<rect x="4" y="5" width="8" height="3" fill="${hair}"/>`,
    bun: `<rect x="6" y="0" width="4" height="3" fill="${hair}"/><rect x="4" y="5" width="3" height="2" fill="${hair}"/>`,
    curls: `<rect x="2" y="4" width="2" height="6" fill="${hair}"/><rect x="12" y="4" width="2" height="6" fill="${hair}"/><rect x="4" y="5" width="2" height="3" fill="${hair}"/><rect x="8" y="5" width="3" height="2" fill="${hair}"/>`,
    pony: `<rect x="12" y="4" width="3" height="9" fill="${hair}"/><rect x="12" y="5" width="3" height="1" fill="#db9e99"/><rect x="4" y="5" width="6" height="2" fill="${hair}"/>`,
    side: `<rect x="4" y="5" width="2" height="4" fill="${hair}"/><rect x="6" y="5" width="4" height="1" fill="${hair}"/>`,
  }[haircut];
  const accessoryShape = {
    glasses: '<path d="M5 8h3v3H5zM9 8h3v3H9zM8 9h1" fill="none" stroke="#514c46" stroke-width=".7"/>',
    bow: '<path d="M10 2h2v1h1V2h2v3h-2V4h-1v1h-2z" fill="#d27891"/>',
    headband: '<rect x="3" y="4" width="10" height="1" fill="#f1d78b"/>',
    cap: '<rect x="4" y="2" width="8" height="3" fill="#a19ac9"/><rect x="3" y="5" width="11" height="1" fill="#7774a8"/><rect x="8" y="3" width="2" height="1" fill="#e5daef"/>',
    beanie: '<rect x="5" y="1" width="6" height="1" fill="#d69a8c"/><rect x="4" y="2" width="8" height="2" fill="#d69a8c"/><rect x="3" y="4" width="10" height="2" fill="#b97d71"/>',
    beret: '<rect x="4" y="1" width="6" height="1" fill="#b09acb"/><rect x="3" y="2" width="10" height="2" fill="#b09acb"/><rect x="2" y="4" width="9" height="1" fill="#8f7aaa"/>',
    headphones: '<path d="M3 6V3h10v3" fill="none" stroke="#e1bd73" stroke-width="1"/><rect x="2" y="6" width="2" height="4" fill="#c99d58"/><rect x="12" y="6" width="2" height="4" fill="#c99d58"/>',
    scarf: '<rect x="5" y="13" width="6" height="2" fill="#e19d86"/><rect x="9" y="15" width="2" height="2" fill="#e19d86"/>',
    overalls: '<path d="M5 13h1v2h4v-2h1v5H5z" fill="#7b96af"/><rect x="6" y="16" width="4" height="1" fill="#c4d6de"/>',
  }[accessory];
  return `<g shape-rendering="crispEdges">
    <rect x="4" y="2" width="8" height="2" fill="${hair}"/><rect x="3" y="4" width="10" height="6" fill="${hair}"/>
    <rect x="4" y="6" width="8" height="7" fill="${skin}"/><rect x="5" y="13" width="6" height="1" fill="${skin}"/>
    <rect x="3" y="8" width="1" height="3" fill="${skin}"/><rect x="12" y="8" width="1" height="3" fill="${skin}"/>
    ${hairShape}<rect x="6" y="8" width="1" height="2" fill="#3f3937"/><rect x="10" y="8" width="1" height="2" fill="#3f3937"/>
    <rect x="4" y="10" width="2" height="1" fill="#dc9290"/><rect x="10" y="10" width="2" height="1" fill="#dc9290"/><rect x="7" y="12" width="2" height="1" fill="#b4776b"/>
    <rect x="4" y="14" width="8" height="5" fill="${shirt}"/><rect x="2" y="15" width="2" height="3" fill="${shirt}"/><rect x="12" y="15" width="2" height="3" fill="${shirt}"/>
    <rect x="2" y="18" width="2" height="1" fill="${skin}"/><rect x="12" y="18" width="2" height="1" fill="${skin}"/>
    <rect x="4" y="19" width="3" height="2" fill="#4a5155"/><rect x="9" y="19" width="3" height="2" fill="#4a5155"/>
    ${accessoryShape}
  </g>`;
}
