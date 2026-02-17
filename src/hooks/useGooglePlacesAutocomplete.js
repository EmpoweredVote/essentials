import { useEffect, useRef } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

function ensureConfigured() {
  // Only call setOptions if importLibrary hasn't been installed yet.
  // Prevents duplicate-call warning during Vite HMR.
  if (API_KEY && !window.google?.maps?.importLibrary) {
    // Use 'key' not 'apiKey' — the loader converts camelCase to snake_case
    // for URL params, so 'apiKey' becomes 'api_key' which Google rejects.
    setOptions({ key: API_KEY });
  }
}

/**
 * Attaches Google Places Autocomplete to an input ref.
 *
 * @param {React.RefObject<HTMLInputElement>} inputRef
 * @param {{ onPlaceSelected: (formattedAddress: string) => void }} options
 */
export default function useGooglePlacesAutocomplete(inputRef, { onPlaceSelected }) {
  const callbackRef = useRef(onPlaceSelected);
  callbackRef.current = onPlaceSelected;

  useEffect(() => {
    if (!API_KEY || !inputRef.current) return;

    let autocomplete = null;

    ensureConfigured();

    importLibrary('places')
      .then((placesLib) => {
        if (!inputRef.current) return;

        autocomplete = new placesLib.Autocomplete(inputRef.current, {
          componentRestrictions: { country: 'us' },
          fields: ['formatted_address', 'address_components'],
          types: ['geocode'],
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place?.formatted_address) {
            callbackRef.current(place.formatted_address);
          }
        });
      });

    return () => {
      if (autocomplete) {
        google.maps.event.clearInstanceListeners(autocomplete);
      }
    };
  }, [inputRef]);
}
