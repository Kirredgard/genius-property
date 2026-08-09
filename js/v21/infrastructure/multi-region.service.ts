export const REGIONS = [
  'europe-west1',
  'us-central1',
  'africa-south1'
];

export function getPreferredRegion(userRegion = 'africa') {
  if (userRegion.includes('africa')) return 'africa-south1';
  if (userRegion.includes('europe')) return 'europe-west1';
  return 'us-central1';
}
