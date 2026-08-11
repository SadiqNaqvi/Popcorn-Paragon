import { ShowError } from "@components/fallbacks";
import { getUserFromToken } from "@lib/backend/utils";
import { calculateAge } from "@lib/shared/utils";
import { cookies } from "next/headers";
import FilterContentTogglePage from "./FilterContent";

const FilterContentPage = async () => {

    const user = await getUserFromToken(await cookies());

    if (!user) return null;

    else if (calculateAge(user.dob) < 18) return (
        <ShowError
            heading="Oops! Looks like you've been stopped by The Parlocula Guards"
            messages={["You are now allowed to be here"]}
        />
    )

    return <FilterContentTogglePage status={user.filterContent} />

}

export default FilterContentPage;