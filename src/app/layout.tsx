import "@app/globals.css";
import "@styles/tailwind.css";
import "@styles/components.css";
import { FancyBoxProvider } from "@components";
import { MainLoading } from "@components/ui/loading";
import { getUserFromToken } from "@lib/auth/utils";
import { getCurrentUser, getNotificationsOfUser, getRooms } from "@lib/helpers/common";
import { fetchQuery, getQueryClient, prefetchInfiniteQuery } from "@lib/providers/queryClient";
import ReactQueryProvider from "@lib/providers/ReactQueryWrapper";
import generateDynamicMetadata, { appViewport } from "@lib/seo/metadata";
import { getQueryKeys } from "@lib/utils";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { CurrentUser } from "@type/internal";
import { ThemeProvider } from "next-themes";
import { cookies } from "next/headers";
import { PropsWithChildren, Suspense } from "react";
import { Toaster } from "sonner";
import UserHydrator from "./UserHydrator";
import localFont from 'next/font/local'
import { generateJsonLdForRoot } from "@lib/seo/jsonld";

const montserratFont = localFont({
  src: "./fonts/Montserrat.ttf",
  variable: "--font-montserrat",
});

const robotoFont = localFont({
  src: "./fonts/Roboto.ttf",
  variable: "--font-roboto"
});

export const metadata = generateDynamicMetadata({ allowRobots: true }, true);

export const viewport = appViewport;

const NotificationFetcher = async ({ children }: PropsWithChildren) => {

  const queryClient = getQueryClient();

  const jar = await cookies();
  const payload = await getUserFromToken(jar);

  let currentUser: CurrentUser | null = null;

  if (payload) {
    const { user_id, username } = payload;

    prefetchInfiniteQuery({
      queryKey: getQueryKeys("rooms_uid", { uid: user_id }),
      queryFn: () => getRooms(user_id, 1, jar),
      queryClient,
    });

    prefetchInfiniteQuery({
      queryClient,
      queryKey: getQueryKeys("notifications_uid", { uid: user_id }),
      queryFn: () => getNotificationsOfUser(user_id, 1, jar)
    });

    const resp = await fetchQuery({
      queryClient,
      queryKey: getQueryKeys("user_username", { username }),
      queryFn: () => getCurrentUser(user_id, jar),
    });

    currentUser = resp;
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {children}
      <UserHydrator currentUser={currentUser} payload={payload} />
    </HydrationBoundary>
  )
}

const RootLayout = async ({ children }: PropsWithChildren) => {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${robotoFont.variable} ${montserratFont.variable} antialiased`}>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={
            {
              __html: JSON.stringify(generateJsonLdForRoot()).replace(/</g, '\\u003c'),
            }
          }
        />

        <Toaster swipeDirections={["bottom", "left", "right"]} />
        <ReactQueryProvider>
          <ThemeProvider enableSystem defaultTheme="system" attribute={"class"}>
            <FancyBoxProvider>
              <Suspense fallback={<MainLoading />}>
                <NotificationFetcher>
                  {children}
                </NotificationFetcher>
              </Suspense>
            </FancyBoxProvider>
          </ThemeProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}

export default RootLayout;
