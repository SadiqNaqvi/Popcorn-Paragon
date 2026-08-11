import { Navigate } from "@components";
import { getUserFromToken } from "@lib/backend/utils";
import generateDynamicMetadata from "@lib/shared/seo/metadata";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata = generateDynamicMetadata({}, true);

const IndexPage = async () => {

  const user = await getUserFromToken(await cookies());
  if (user) redirect('/home');

  return (
    <>
      <div className="patternBackground"></div>
      <header className="size-screen px-4 relative flex gap-4 flex-col flex-cntr-all">
        <div>
          <h1 className="text-4xl font-semibold text-center">Parlocula</h1>
          <p className="text-center">The Cinematic Planet</p>
        </div>

        <section className="fixed sm:static bottom-0 w-full sm:w-fit sm:mx-auto p-4 bg-zinc-500/40 sm:bg-transparent rounded-t-md">
          <div className="flex gap-2 flex-col sm:flex-row">
            <Navigate
              comp="link"
              goto="/join"
              type="button"
              data-testid="join-button"
              className="btn primary">
              Join as a Fan
            </Navigate>
            <Navigate
              comp="link"
              goto="/home"
              type="button"
              data-testid="join-as-guest-button"
              className="btn secondary">
              Explore as Guest
            </Navigate>
          </div>
          <div className="text-sm mt-4 sm:mt-0 sm:fixed bottom-3 left-0 w-full flex flex-wrap flex-cntr-all gap-2">
            <Navigate comp="link" className="inline underline whitespace-nowrap" goto="/app/about">About Parlocula</Navigate>
            <span>|</span>
            <Navigate comp="link" className="inline underline whitespace-nowrap" goto="/app/terms_and_conditions">Terms and Conditions</Navigate>
            <span>|</span>
            <Navigate comp="link" className="inline underline whitespace-nowrap" goto="/app/privacy_policy">Privacy Policy</Navigate>
          </div>
        </section>
      </header>
    </>
  );
}

export default IndexPage;
