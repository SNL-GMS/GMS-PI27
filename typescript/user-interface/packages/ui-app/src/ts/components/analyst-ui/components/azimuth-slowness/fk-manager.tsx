import { useBeamformingTemplatesForFK, useFkSpectraTemplatesQuery } from '@gms/ui-state';

/**
 * Hook component that fetches the fk templates.
 */
export function FkManager() {
  useBeamformingTemplatesForFK();
  useFkSpectraTemplatesQuery();
  return null;
}
