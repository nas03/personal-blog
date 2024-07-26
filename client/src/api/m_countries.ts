import { MCountriesRepo } from '@/constants/schema';
import axios from '@/helper/axios';

export const getCountriesData = async (): Promise<Omit<MCountriesRepo, 'id'>[]> => {
  try {
    const response = await axios.get('/data/country/all');
    if (response.status === 200) {
      const data: Omit<MCountriesRepo, 'id'>[] = response.data.data;
      return data;
    }
    return [];
  } catch (error) {
    console.log(error);
    return [];
  }
};
