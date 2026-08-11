"use client";

import { Navbar } from "@components";
import ToggleButtonBar from "@components/ui/ToggleButtonBar";
import { toggleContentFiltering } from "@lib/frontend/helpers/mutations";
import { useDebounce } from "@lib/frontend/hooks";
import { useState } from "react";

const FilterContentTogglePage = ({ status }: { status: boolean }) => {

    const [checked, SetChecked] = useState(status);
    const { mutate, setFinalState } = useDebounce(toggleContentFiltering, { initial: status });

    const handleToggle = () => {
        setFinalState(!checked);
        SetChecked(!checked);
        mutate();
    }

    return (
        <>
            <Navbar navTitle="Filter Content" className="border-b border-gray20" />
            <section className="mt-6 spae-y-8 px-2">
                <ToggleButtonBar
                    label="Filter Contents"
                    checked={checked}
                    onClick={handleToggle}
                />

                <p className="mt-4 text-center">
                    {status ?

                        "By turning it off, explicit contents won't be filtered out."
                        :
                        "By turning it on, explicit contents in Posts, Comments and Threads will be filtered out before they reach you."
                    }
                </p>
            </section>
        </>
    )


}

export default FilterContentTogglePage;