import { MCountriesRepo } from "@/constants/schema";
import { db } from "@/helpers";

export const getCountriesData = async () => {
  const query = await db<MCountriesRepo>("m_countries").select("country_code", "country_name", "thumbnail", "country_number").where("delete_flag", 0);
  return query;
};
