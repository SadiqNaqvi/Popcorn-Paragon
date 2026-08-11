import { FullTaleonType, GeneralGetReturn } from "@type/internal";
import {
  ExtGeneralPaginatedData,
  ExtPaginatedSearchData,
  ExtSearchDataTaleonOnly,
  GeneralExtReturn,
  PaginatedData,
  RefinedCollectionData,
  RefinedCompanyData,
  RefinedEpisodeData,
  RefinedMovieData,
  RefinedPersonData,
  RefinedSeasonData,
  RefinedShowData,
  SortOptions
} from "@type/external";
import { oneDayInSeconds } from "@lib/shared/constants";
import { getTaleon } from "./internal_fetchers";

export const fetchExt = async <T = unknown>(url: string, revalidate?: number): Promise<GeneralExtReturn<T>> => {
  try {
    return await fetch(
      `https://testlalaapp.vercel.app/api/${url}`,
      { next: { revalidate: revalidate || oneDayInSeconds * 3 } }
    ).then((r) => r.json());
  } catch {
    return { status: false, response: "" }
  }
}

export type TaleonReturnType<T extends boolean, D> = T extends true ? D & FullTaleonType : D
export type MovieReturnType<T extends boolean> = TaleonReturnType<T, RefinedMovieData>
export type ShowReturnType<T extends boolean> = TaleonReturnType<T, RefinedShowData>

export const fetchMovie = async<T extends boolean>(id: string, getInternalData: T): Promise<TaleonReturnType<T, RefinedMovieData> | undefined> => {
  if (!id) return;

  const [ext_id] = id.split('-');

  const [data, taleon] = await Promise.all([
    fetchExt<RefinedMovieData>(`movie?id=${ext_id}`),
    ...(getInternalData ? [getTaleon(ext_id, "movie")] : []),
  ]);

  if (getInternalData && !taleon)
    throw new Error("Error occured while fetching taleon for the movie")

  else if (!data || !data.status) return;
  else if (!getInternalData) return data.response as MovieReturnType<T>;
  return {
    ...data.response,
    ...taleon
  } as MovieReturnType<T>
};

export const fetchSimilarMovies = async (id: string, page = 1) => {
  if (!id) return;

  const data = await fetchExt<ExtGeneralPaginatedData>(`movie/similar?id=${id}&p=${page}`);

  if (data.status) return data.response;
};

export const fetchMoviesWithCast = async (
  id: string,
  page: number = 1,
  sort_by: SortOptions = "popularity"
) => {
  if (!id) return;

  const data = await fetchExt<ExtGeneralPaginatedData>(`movies?c=${id}&sort=${sort_by}&p=${page}`);

  if (data.status) return {
    success: true,
    result: data.response,
  }

  console.error(
    "Some erorr occoured while fetching movies with cast: " + data.response
  );
  return { success: false, errCode: "uncaught_error" };
};

export const fetchMoviesWithGenres = async ({
  genre,
  page = 1,
  sort_by = "popularity",
}: {
  genre: string;
  page: number;
  sort_by: SortOptions;
}): Promise<GeneralGetReturn<ExtGeneralPaginatedData>> => {
  const data = await fetchExt<ExtGeneralPaginatedData>(`movies?g=${genre}&sort=${sort_by}&p=${page}`);

  if (data.status) return {
    success: true,
    result: data.response,
  }

  console.error(
    "Some erorr occoured while fetching movies with genres: " + data.response
  );
  return { success: false, errCode: "uncaught_error" };
};

export const fetchMoviesWithYear = async (
  year: string,
  page: number = 1,
  sort_by: SortOptions = "popularity"
) => {
  const time = new Date(year).getTime();
  if (isNaN(time) || time > Date.now()) return;

  const data = await fetchExt<ExtGeneralPaginatedData>(`movies?y=${year}&sort=${sort_by}&p=${page}`);

  if (data.status) return {
    success: true,
    result: data.response,
  }

  console.error(
    "Some erorr occoured while fetching movies with year: " + data.response
  );
  return { success: false, errCode: "uncaught_error" };
};

export const fetchMoviesWithCompany = async (
  id: string,
  page: number = 1,
  sort_by: SortOptions = "popularity"
) => {
  if (!id) return;

  const data = await fetchExt<ExtGeneralPaginatedData>(`company/movies?id=${id}&sort=${sort_by}&p=${page}`)

  if (data.status) return data.response;

};

export const fetchMoviesWithNetwork = async (
  id: string,
  page: number = 1,
  sort_by: SortOptions = "popularity"
) => {
  if (!id) return;

  const data = await fetchExt<ExtGeneralPaginatedData>(`network/movies?id=${id}&sort=${sort_by}&p=${page}`)

  if (data.status) return data.response
};

export const fetchCollection = async (id: string) => {
  if (!id) return;

  const data = await fetchExt<RefinedCollectionData>(`collection?id=${id}`)

  if (data.status) return data.response;
  console.error(
    "Some erorr occoured while fetching collection: " + data.response
  );
  return;
}

export const fetchCompany = async (id: string) => {
  if (!id) return;

  const data = await fetchExt<RefinedCompanyData>(`company?id=${id}`)

  if (data.status) return data.response;

  console.error(
    "Some erorr occoured while fetching company: " + data.response
  );
  return;
};

export const findWithIMDB = async (id: string) => {
  if (!id) return;

  const data = await fetchExt(`find?id=${id}`)

  if (data.status) return {
    success: true,
    result: data.response,
  }

  console.error("Some erorr occoured while finding movie: " + data.response);
  return { success: false, errCode: "uncaught_error" };
}

export const fetchNetwork = async (id: string) => {
  if (!id) return;

  const data = await fetchExt<RefinedCompanyData>(`network?id=${id}`)

  if (data.status) return data.response;

  console.error(
    "Some erorr occoured while fetching network: " + data.response
  );
  return;

};

export const fetchPerson = async (id: string) => {
  if (!id) return;

  const data = await fetchExt<RefinedPersonData>(`person?id=${id}`);


  if (data.status) return data.response;

  console.error(
    "Some erorr occoured while fetching person: " + data.response
  );
  return;

};

export const fetchShow = async <T extends boolean>(id: string, getInternalData: T): Promise<ShowReturnType<T> | undefined> => {
  if (!id) return;

  const [ext_id] = id.split('-');

  const [data, taleon] = await Promise.all([
    fetchExt<RefinedShowData>(`show?id=${ext_id}`),
    ...(getInternalData ? [getTaleon(ext_id, "show")] : []),
  ]);

  if (!data || !data.status || (getInternalData && !taleon)) return;
  else if (!getInternalData) return data.response as ShowReturnType<T>;
  return {
    ...data.response,
    ...taleon
  } as ShowReturnType<T>

};

export const fetchSeasonForShow = async (
  show_id: string,
  season = 1
): Promise<RefinedSeasonData | undefined> => {
  if (!show_id) return;

  const data = await fetchExt<RefinedSeasonData>(`show/seasons?id=${show_id}&s=${season}`)

  if (data.status)
    return data.response;

};

export const fetchEpisodeForSeason = async (
  show_id: string,
  season = 1,
  episode = 1
): Promise<RefinedEpisodeData | undefined> => {
  if (!show_id) return;

  const data = await fetchExt<RefinedEpisodeData>(`show/episode?id=${show_id}&s=${season}&e=${episode}`)

  if (data.status)
    return data.response;

};

export const fetchSimilarShows = async (id: string, page: number = 1) => {
  if (!id) return;

  const data = await fetchExt<ExtGeneralPaginatedData>(`show/similar?id=${id}&p=${page}`)

  if (data.status) return data.response;
  console.error(
    "Some erorr occoured while fetching movie recommendations: " +
    data.response
  );
  return;
};

export const fetchShowsWithGenres = async ({
  genre,
  page = 1,
  sort_by = "popularity",
}: {
  genre: string;
  page: number;
  sort_by: SortOptions;
}): Promise<GeneralGetReturn<ExtGeneralPaginatedData>> => {

  const data = await fetchExt<ExtGeneralPaginatedData>(`shows?g=${genre}&sort=${sort_by}&p=${page}`)

  if (data.status) return {
    success: true,
    result: data.response,
  }

  console.error(
    "Some erorr occoured while fetching shows with genres: " + data.response
  );
  return { success: false, errCode: "uncaught_error" };

};

export const fetchShowsWithCompany = async (
  id: string,
  page: number = 1,
  sort_by: SortOptions = "popularity"
) => {
  if (!id) return;

  const data = await fetchExt<ExtGeneralPaginatedData>(`company/shows?id=${id}&sort=${sort_by}&p=${page}`)

  if (data.status) return data.response;

}

export const fetchShowsWithNetwork = async (
  id: string,
  page: number = 1,
  sort_by: SortOptions = "popularity"
) => {
  if (!id) return;

  const data = await fetchExt<ExtGeneralPaginatedData>(`network/shows?id=${id}&sort=${sort_by}&p=${page}`)

  if (data.status) return data.response;

}

const filterNonPosterResults = (response: ExtPaginatedSearchData): ExtPaginatedSearchData => {
  return {
    ...response,
    results: response.results.filter(res => res.image)
  }
}

export const searchCompany = async (query: string, page: number = 1): Promise<GeneralGetReturn<ExtPaginatedSearchData>> => {

  const data = await fetchExt<ExtPaginatedSearchData>(`search?q=${query}&t=company&p=${page}`)

  if (data.status) return {
    success: true,
    result: filterNonPosterResults(data.response),
  }

  console.error(
    "Some erorr occoured while searching company: " + data.response
  );
  return { success: false, errCode: "uncaught_error" };

};

export const searchCollection = async (query: string, page: number = 1): Promise<GeneralGetReturn<ExtPaginatedSearchData>> => {

  const data = await fetchExt<ExtPaginatedSearchData>(`search?q=${query}&t=collection&p=${page}`)

  if (data.status) return {
    success: true,
    result: filterNonPosterResults(data.response),
  }

  console.error(
    "Some erorr occoured while searching collection: " + data.response
  );
  return { success: false, errCode: "uncaught_error" };

};

export const searchMovie = async (query: string, page: number = 1): Promise<GeneralGetReturn<ExtPaginatedSearchData>> => {

  const data = await fetchExt<ExtPaginatedSearchData>(`search?q=${query}&t=movie&p=${page}`)

  if (data.status) return {
    success: true,
    result: filterNonPosterResults(data.response),
  }

  console.error(
    "Some erorr occoured while searching movies: " + data.response
  );
  return { success: false, errCode: "uncaught_error" };

};

export const searchShow = async (query: string, page: number = 1): Promise<GeneralGetReturn<ExtPaginatedSearchData>> => {

  const data = await fetchExt<ExtPaginatedSearchData>(`search?q=${query}&t=tv&p=${page}`)

  if (data.status) return {
    success: true,
    result: filterNonPosterResults(data.response),
  }

  console.error(
    "Some erorr occoured while searching shows: " + data.response
  );
  return { success: false, errCode: "uncaught_error" };

};

export const searchPerson = async (query: string, page: number = 1): Promise<GeneralGetReturn<ExtPaginatedSearchData>> => {

  const data = await fetchExt<ExtPaginatedSearchData>(`search?q=${query}&t=person&p=${page}`)

  if (data.status) return {
    success: true,
    result: filterNonPosterResults(data.response),
  }

  console.error(
    "Some erorr occoured while searching person: " + data.response
  );
  return { success: false, errCode: "uncaught_error" };

};

export const searchAllContent = async (query: string, page: number = 1): Promise<GeneralGetReturn<ExtPaginatedSearchData>> => {
  if (!query) throw new Error("Query is required to search");

  const data = await fetchExt<ExtPaginatedSearchData>(`search?q=${query}&t=multi&p=${page}`)

  if (data.status) return {
    success: true,
    result: filterNonPosterResults(data.response),
  };

  console.error(
    "Some erorr occoured while searching content: " + data.response
  );

  return { success: false, errCode: "uncaught_error" }

};

export const searchTaleonsOnly = async (query: string, page = 1): Promise<GeneralGetReturn<PaginatedData<ExtSearchDataTaleonOnly>>> => {
  const data = await fetchExt<PaginatedData<ExtSearchDataTaleonOnly>>(`search?q=${query}&t=taleons&p=${page}`)

  if (data.status) return {
    success: true,
    result: {
      ...data.response,
      results: data.response.results.filter(res => res.poster),
    }
  };

  console.error(
    "Some erorr occoured while searching media items: " + data.response
  );
  return { success: false, errCode: "uncaught_error" };
};

export const fetchTrendingMovies = async (page: number = 1) => {

  const data = await fetchExt<ExtGeneralPaginatedData>(`trending?t=movie&p=${page}`);

  if (typeof data.response === "string") {
    console.error(
      "Some erorr occoured while fetching trending shows: ", data
    );
    return;
  }

  return data.response;

};

export const fetchTrendingShows = async (page: number = 1) => {

  const data = await fetchExt<ExtGeneralPaginatedData>(`trending?t=tv&p=${page}`)

  if (typeof data.response === "string") {
    console.error(
      "Some erorr occoured while fetching trending shows:", data
    );
    return;
  }

  return data.response;
};

export const fetchTrendingPerson = async (page: number = 1) => {

  const data = await fetchExt<ExtGeneralPaginatedData>(`trending?t=person&p=${page}`)

  if (data.status) return data.response;
  console.error(
    "Some erorr occoured while fetching trending people: " + data.response
  );
  return;

};

export const fetchTrendingContent = async (page: number = 1) => {

  const data = await fetchExt<ExtGeneralPaginatedData>(`trending?t=all&p=${page}`)
  if (data.status) return data.response;
  console.error(
    "Some erorr occoured while fetching trending content: " + data.response
  );
  return;

};
