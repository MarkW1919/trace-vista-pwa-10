import { ConsentWarning } from './ConsentWarning';

export const TestConsentWarning = () => {
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Consent Warning Component Test</h2>
      
      <h3 className="text-lg font-semibold">Default Variant:</h3>
      <ConsentWarning />
      
      <h3 className="text-lg font-semibold">Prominent Variant:</h3>
      <ConsentWarning variant="prominent" />
      
      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h4 className="font-medium mb-2">Test Status:</h4>
        <ul className="text-sm space-y-1">
          <li>✅ Text visibility should be clear in both light and dark modes</li>
          <li>✅ Colors should have proper contrast</li>
          <li>✅ Icons should be visible and properly colored</li>
          <li>✅ Component should be responsive</li>
        </ul>
      </div>
    </div>
  );
};