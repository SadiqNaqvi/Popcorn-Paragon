"use client"

import { RightChevron } from "@assets/Icons";
import { InfiniteScroller, Navigate } from "@components";
import { OptionalChildren, ShelfBar } from "@components/ui";
import { ShelfBarListSkeleton } from "@components/ui/loading";
import { getShelvesOfUser } from "@lib/shared/helpers/internal_fetchers";
import { getQueryKeys } from "@lib/shared/utils";
import { RequestedUser } from "@type/internal";
import { PredefinedShelves } from "@type/models";

type Props = {
  user: RequestedUser;
  page: number;
  filter: string;
  current: boolean;
};

const PredefinedShelvesList = ({ user }: { user: RequestedUser }) => (
  <ul className="mb-2 space-y-2">

    {user.predefinedShelves.map(({ _id, name, poster }) => (

      <li key={_id}>

        <ShelfBar
          _id={_id}
          name={name}
          poster={poster}
          shelf_type={name as PredefinedShelves}
          isPrivate={false}
          shelfKey={undefined}
        />

      </li>

    ))}

  </ul>
)

const Shelves = ({ filter, page, user, current }: Props) => {

  const uid = user._id;

  return (
    <section className="h-size-screen">

      <OptionalChildren condition={current}>
        <Navigate goto="/shelf/all" comp="link" className="my-4 mx-2 px-2 py-3 rounded-md border border-gray30 flex flex-cntr-between">
          <span>View All Shelves</span>
          <RightChevron />
        </Navigate>
      </OptionalChildren>

      <PredefinedShelvesList user={user} />

      <InfiniteScroller
        initialPage={page}
        className="space-y-2"
        Loading={<ShelfBarListSkeleton />}
        queryKeys={getQueryKeys("shelvesOfUser_uid_filter", { uid, filter })}
        fetchData={(p) => getShelvesOfUser(uid, p, filter)}
        Component={ShelfBar}
        NotFoundSection={<></>}
      />

    </section>
  );
};

export default Shelves;
