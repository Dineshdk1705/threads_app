import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";

import UserCard from "@/components/cards/UserCard";
import SearchBar from "@/components/shared/SearchBar";
import Pagination from "@/components/shared/Pagination";

import { fetchUser, fetchUsers } from "@/lib/actions/user.actions";

interface PageProps {
  searchParams?: { [key: string]: string | undefined };
}

const Page = async ({ searchParams = {} }: PageProps) => {
  // Fetch the current user
  const user = await currentUser();
  if (!user) return null;
  if (!searchParams) return null;
  // Fetch user information
  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  // Parse the page number from searchParams safely
  const pageNumber = searchParams.page ? parseInt(searchParams.page, 10) : 1;

  // Fetch users based on search criteria
  const result: any = await fetchUsers({
    userId: user.id,
    searchString: searchParams.q ?? "",
    pageNumber,
    pageSize: 25,
  });

  return (
    <section>
      <h1 className="head-text mb-10">Search</h1>

      <SearchBar routeType="search" />

      <div className="mt-14 flex flex-col gap-9">
        {result?.users?.length === 0 ? (
          <p className="no-result">No Result</p>
        ) : (
          <>
            {result?.users?.map((person: any) => (
              <UserCard
                key={person.id}
                id={person.id}
                name={person.name}
                username={person.username}
                imgUrl={person.image}
                personType="User"
              />
            ))}
          </>
        )}
      </div>

      <Pagination
        path="search"
        pageNumber={pageNumber}
        isNext={result?.isNext ?? false}
      />
    </section>
  );
};

export default Page;
