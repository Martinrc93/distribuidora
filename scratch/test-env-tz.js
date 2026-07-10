console.log('Original Timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
console.log('Original Date string:', new Date().toString());

process.env.TZ = 'America/Argentina/Buenos_Aires';
console.log('After setting America/Argentina/Buenos_Aires:');
console.log('Resolved Timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
console.log('Date string:', new Date().toString());

process.env.TZ = 'UTC';
console.log('After setting UTC:');
console.log('Resolved Timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
console.log('Date string:', new Date().toString());
