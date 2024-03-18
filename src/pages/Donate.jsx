import { useEffect, useCallback, useReducer } from 'react';
import { useTranslation } from 'react-i18next';
import Container from '../components/Container';
import SectionHeader from '../components/SectionHeader';
import Alert from '../components/Alert';
import StateSelector from '../components/StateSelector';
import CharityCard from '../components/CharityCard';
import Loading from '../components/Loading';
import Error from '../components/Error';
import getCurrentLocation from '../components/utilities';
import { getCharities as getCharitiesFromApi } from '../components/utilities';

const initialState = {
  loading: true,
  error: null,
  errorType: null, // Add errorType to state
  charities: [],
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_INIT':
      return { ...state, loading: true, error: null, errorType: null };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        loading: false,
        charities: action.payload,
        error: null,
        errorType: null,
      };
    case 'LOCATION_FETCH_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.payload,
        errorType: 'location',
      };
    case 'CHARITIES_FETCH_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.payload,
        errorType: 'charities',
      };
    default:
      return state;
  }
};

const Donate = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { t } = useTranslation();

  const fetchLocationAndCharities = useCallback(async () => {
    dispatch({ type: 'FETCH_INIT' });
    setTimeout(() => {
      dispatch({
        type: 'CHARITIES_FETCH_FAILURE',
        payload: 'Something went wrong. Please try again later.',
      });
    }, 1000);
    try {
      const { error: locationError, data } = await getCurrentLocation();
      if (locationError) {
        dispatch({ type: 'LOCATION_FETCH_FAILURE', payload: locationError });
        return;
      }
      console.log('Location data:', data);

      const { error: charitiesError, charities } = await getCharitiesFromApi();
      if (charitiesError) {
        dispatch({ type: 'CHARITIES_FETCH_FAILURE', payload: charitiesError });
      } else {
        dispatch({ type: 'FETCH_SUCCESS', payload: charities });
      }
    } catch (error) {
      // Generic error handling
      dispatch({ type: 'FETCH_FAILURE', payload: 'Unexpected error occurred' });
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchLocationAndCharities();
  }, [fetchLocationAndCharities]);

  const location = sessionStorage.getItem('currentLocationState');

  return (
    <main className="min-h-screen pb-6">
      {state.error && state.errorType === 'location' && (
        <Alert type="warning">{state.error}</Alert>
      )}
      <Container>
        <SectionHeader
          title={t('Donate_BTN')}
          description={t('donate_desc')}
          center={true}
        />
        <div className="flex gap-4 items-center mb-4">
          <StateSelector location={location} />
          <div className="bg-red-500 rounded py-1 px-2 text-white flex items-center">
            <span className="bg-white rounded-full w-8 h-8 text-black mx-2 flex justify-center items-center font-bold">
              {state.charities.length}{' '}
            </span>{' '}
            Found
          </div>
        </div>
        {state.loading ? (
          <Loading />
        ) : (
          <div className="flex flex-wrap justify-evenly gap-2">
            {state.charities.map((charity) => (
              <CharityCard
                key={charity.id}
                name={charity.name}
                description={charity.description}
                image={charity.img}
                methods={charity.methods}
              />
            ))}
          </div>
        )}
      </Container>
      {state.error && state.errorType === 'charities' && (
        <Error message={state.error} />
      )}
    </main>
  );
};

export default Donate;
