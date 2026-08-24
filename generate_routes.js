const fs = require('fs');
const path = require('path');

const steps = [
  { file: 'role-selection.tsx', component: 'RoleSelectionScreen', importPath: '@/screens/onboarding/shared/RoleSelectionScreen', onNext: "(role) => goToStep('name-input', { role })", onBack: "async () => await signOut()" },
  { file: 'name-input.tsx', component: 'NameInputScreen', importPath: '@/screens/onboarding/shared/NameInputScreen', customLogic: `
    <NameInputScreen
      role={onboardingData?.role || 'Influencer'}
      onBack={() => goToStep('role-selection')}
      onNext={(name, instagramUsername) => {
        if (onboardingData?.role === 'Influencer' || !onboardingData?.role) {
          goToStep('dob-input', { name, instagramUsername });
        } else {
          goToStep('brand-platforms', { name, instagramUsername });
        }
      }}
    />` },
  { file: 'dob-input.tsx', component: 'DateOfBirthScreen', importPath: '@/screens/onboarding/influencer/DateOfBirthScreen', onNext: "(dob) => goToStep('gender-input', { dob })", onBack: "() => goToStep('name-input')" },
  { file: 'gender-input.tsx', component: 'GenderSelectionScreen', importPath: '@/screens/onboarding/influencer/GenderSelectionScreen', onNext: "(gender) => goToStep('social-platforms', { gender })", onBack: "() => goToStep('dob-input')" },
  { file: 'social-platforms.tsx', component: 'SocialPlatformSelectionScreen', importPath: '@/screens/onboarding/influencer/SocialPlatformSelectionScreen', onNext: "(platforms) => goToStep('categories', { platforms })", onBack: "() => goToStep('gender-input')" },
  { file: 'categories.tsx', component: 'CategorySelectionScreen', importPath: '@/screens/onboarding/influencer/CategorySelectionScreen', onNext: "(categories) => goToStep('location', { categories })", onBack: "() => goToStep('social-platforms')" },
  { file: 'location.tsx', component: 'LocationEntryScreen', importPath: '@/screens/onboarding/influencer/LocationEntryScreen', onNext: "(location) => goToStep('bio-input', { location })", onBack: "() => goToStep('categories')", onNextProp: 'onAllow' },
  { file: 'bio-input.tsx', component: 'BioInputScreen', importPath: '@/screens/onboarding/influencer/BioInputScreen', onNext: "(bio) => goToStep('photos', { bio })", onBack: "() => goToStep('location')" },
  { file: 'photos.tsx', component: 'PhotoUploadScreen', importPath: '@/screens/onboarding/influencer/PhotoUploadScreen', onNext: "(photos) => goToStep('price-packages', { photos })", onBack: "() => goToStep('bio-input')" },
  { file: 'price-packages.tsx', component: 'PricePackagesScreen', importPath: '@/screens/onboarding/influencer/PricePackagesScreen', customLogic: `
    <PricePackagesScreen
      onBack={() => goToStep('photos')}
      onStart={async (packages) => {
        await updateOnboarding({ packages, currentStep: 'price_packages' });
        await completeOnboarding();
        router.replace('/(influencer-tabs)/home');
      }}
    />` },
  { file: 'brand-platforms.tsx', component: 'BrandPlatformSelectionScreen', importPath: '@/screens/onboarding/brand/BrandPlatformSelectionScreen', onNext: "(platforms) => goToStep('brand-location', { platforms })", onBack: "() => goToStep('name-input')" },
  { file: 'brand-location.tsx', component: 'BrandLocationScreen', importPath: '@/screens/onboarding/brand/BrandLocationScreen', onNext: "(location) => goToStep('brand-bio-input', { location })", onBack: "() => goToStep('brand-platforms')", onNextProp: 'onAllow' },
  { file: 'brand-bio-input.tsx', component: 'BrandBioInputScreen', importPath: '@/screens/onboarding/brand/BrandBioInputScreen', onNext: "(bio) => goToStep('brand-logo-upload', { bio })", onBack: "() => goToStep('brand-location')" },
  { file: 'brand-logo-upload.tsx', component: 'BrandLogoUploadScreen', importPath: '@/screens/onboarding/brand/BrandLogoUploadScreen', onNext: "(logo) => goToStep('brand-campaign-upload', { logo })", onBack: "() => goToStep('brand-bio-input')" },
  { file: 'brand-campaign-upload.tsx', component: 'BrandCampaignUploadScreen', importPath: '@/screens/onboarding/brand/BrandCampaignUploadScreen', customLogic: `
    <BrandCampaignUploadScreen
      onBack={() => goToStep('brand-logo-upload')}
      onNext={(campaignPhotos) => goToStep('brand-categories', { 
        photos: [...(onboardingData?.photos || []), ...campaignPhotos] 
      })}
    />` },
  { file: 'brand-categories.tsx', component: 'BrandCategorySelectionScreen', importPath: '@/screens/onboarding/brand/BrandCategorySelectionScreen', customLogic: `
    <BrandCategorySelectionScreen
      onBack={() => goToStep('brand-campaign-upload')}
      onNext={async (categories) => {
        await updateOnboarding({ categories, currentStep: 'brand_categories' });
        await completeOnboarding();
        router.replace('/(brand-tabs)/home');
      }}
    />` }
];

const outDir = path.join(__dirname, 'app', 'onboarding');

for (const step of steps) {
  const content = `import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { ${step.component} } from '${step.importPath}';

export default function Route() {
  const router = useRouter();
  const { updateOnboarding, completeOnboarding, onboardingData, signOut } = useAuth();

  const goToStep = async (nextRoute: string, data?: Record<string, any>) => {
    // Map dashed routes back to underscore step names for the database
    const stepName = nextRoute.replace(/-/g, '_');
    await updateOnboarding({ currentStep: stepName, ...data });
    router.push(\`/onboarding/\${nextRoute}\`);
  };

  return (
    ${step.customLogic ? step.customLogic.trim() : `<${step.component}
      onBack={${step.onBack}}
      ${step.onNextProp || 'onNext'}={${step.onNext}}
    />`}
  );
}
`;
  fs.writeFileSync(path.join(outDir, step.file), content);
}

// Create _layout.tsx
fs.writeFileSync(path.join(outDir, '_layout.tsx'), `import { Stack } from 'expo-router';
export default function Layout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}
`);
console.log('Routes generated');
