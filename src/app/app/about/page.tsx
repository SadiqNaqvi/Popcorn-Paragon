import { Navbar } from "@components";
import { BlogHeading1, BlogHeading2, BlogHeading3, BlogList, BlogSection, BlogSubSection } from "@components/blog";
import { ParloFooter } from "@components/ui";
import generateDynamicMetadata from '@lib/shared/seo/metadata';
import type { Metadata } from 'next';

export const dynamic = "force-static";

export const metadata: Metadata = generateDynamicMetadata({ title: "About" });

const AppAboutPage = () => {

    return (
        <>
            <Navbar />
            <main className="noPadding px-4 py-6">

                <BlogHeading1>About Parlocula</BlogHeading1>

                <header className="mt-6 p-2 rounded-md bg-gray10 border border-gray10">
                    <div className="my-6">
                        <BlogHeading2>What is Parlocula?</BlogHeading2>
                        <p className="mt-2">You need to know before you dive in.</p>
                    </div>

                    <div>
                        <BlogHeading3>Parlocula is The Cinematic Planet</BlogHeading3>
                        <p className="my-2">A place where movies and shows stay alive through people, not feeds.</p>
                        <p className="my-2">
                            Built for people who not just watch movies and shows - they feel them, analyze them and <strong>live</strong> them.
                        </p>
                    </div>

                    <div className="my-4 ml-2 pl-2 border-l-2 border-zinc-500">
                        <p>The name comes from two beautiful ideas:</p>
                        <ul>
                            <BlogList><strong>“Parlo”</strong> - Italian for “I speak”</BlogList>
                            <BlogList><strong>“cula”</strong> - from Spanish “película”, meaning “motion picture”</BlogList>
                        </ul>
                    </div>
                    <div className="space-y-2">
                        <p>Together, Parlo + cula is <strong>{'"'}To speak about motion pictures{'"'}</strong> and that is exactly what this place is.</p>

                        <p><strong>A home for taleons</strong> - the films, series, characters, artists, and stories that shape our lives.</p>
                    </div>
                </header>

                <BlogSection>
                    <BlogHeading2>Why Parlocula Exists?</BlogHeading2>

                    <p className="mt-2">It exists because, <strong>Cinema deserves a dedicated place.</strong> It was never meant to be consumed and forgotten but to be lived.</p>

                    <BlogSubSection className="mt-4">
                        <div>
                            <BlogHeading3>Cinema has always done more than entertain.</BlogHeading3>
                            <p className="mt-2 text-sm">
                                It has shaped how we feel, how we think, and how we see the world.
                                Yet the spaces built around it have reduced it to ratings, reactions, and fleeting posts.
                            </p>
                        </div>

                        <div className="pl-2 ml-2 w-fit mt-6 border-l-2 border-gray-500">
                            <BlogSubSection className="mx-0 space-y-1">
                                <p className="ghostColor text-sm">For Other Platforms:</p>
                                <p>Cinema is a small part in their feed.</p>
                            </BlogSubSection>
                            <BlogSubSection className="mx-0 space-y-1">
                                <p className="ghostColor text-sm">For Us:</p>
                                <p>It is an Art to be admired even after the screen fades to black.</p>
                            </BlogSubSection>
                        </div>
                        <p className="mt-6 font-semibold">You deseve time, not timelines. Depth, not distraction. Memory, not disappearance.</p>
                    </BlogSubSection>
                </BlogSection>

                <BlogSection>
                    <BlogHeading2>Who is Parlocula For?</BlogHeading2>
                    <p className="mt-2">You already may have figured out but keep going.</p>

                    <BlogSubSection className='mt-6'>
                        <BlogHeading3>Parlocula could be a new planet for:</BlogHeading3>
                        <ul>
                            <BlogList>The Taleonist who rewinds to watch their favorite scene again.</BlogList>
                            <BlogList>The one who thinks more after the story ends.</BlogList>
                            <BlogList>Friends who want to share a Shelf, not a feed.</BlogList>
                            <BlogList>Creators who want their work to live in culture, not timelines.</BlogList>
                            <BlogList>Newcomers who just begin to explore the magic.</BlogList>
                        </ul>

                        <p className="mt-6">You don{"'"}t need to know everything. You just need to care enough to stay.</p>

                    </BlogSubSection>
                </BlogSection>

                <BlogSection className='space-y-6'>
                    <div>
                        <BlogHeading2>We don{"'"}t call it a Social Media App</BlogHeading2>
                        <p className="mt-1">You may have noticed and you wanna know why.</p>
                    </div>

                    <div>
                        <p>Social Media is built on feeds. Feeds are built for speed. Speed is built to forget.</p>
                        <p className="mt-2 mb-1">
                            <strong>Parlocula rejects that model entirely.</strong>
                        </p>
                    </div>

                    <div className="flex flex-col md:flex-row justify-around gap-4">
                        <div className="md:w-1/2 p-2 border border-gray10 bg-gray10 rounded-md">
                            <p className="ghostColor text-sm text-left">A Social Media App:</p>
                            <ul>
                                <BlogList>Prioritize feed - You see, You react, You scroll.</BlogList>
                                <BlogList>Algorithm Based - Master Minds control what you see.</BlogList>
                                <BlogList>Noisy - You are just a follower for others.</BlogList>
                                <BlogList>Fake freedom - Go against the system and you{"'"}re blocked.</BlogList>
                            </ul>
                        </div>
                        <div className="md:w-1/2 p-2 border border-gray10 bg-gray10 rounded-md">
                            <p className="ghostColor text-sm text-left">The Cinematic Planet:</p>
                            <ul>
                                <BlogList>Prioritize Moments - You see a question, discussion or theory, You join the conversation.</BlogList>
                                <BlogList>Meaning Over Metrics - You see what you like.</BlogList>
                                <BlogList>Presence Over Posting - Every word from you matter for people.</BlogList>
                                <BlogList>Allows Critisism - because you deserve the freedom.</BlogList>
                            </ul>
                        </div>
                    </div>
                    <p>Parlocula isn{"'"}t about scrolling, it{"'"}s about living the moment.</p>
                </BlogSection>

                <BlogSection>
                    <BlogHeading2>What You Can Do on Parlocula</BlogHeading2>
                    <p className="my-2">Below are the core features designed to make Parlocula the ultimate social home for cine-lovers.</p>

                    <BlogSubSection className="my-8">
                        <div>
                            <BlogHeading3>1. Taleons Wiki</BlogHeading3>
                            <p className="mt-1 text-sm">A complete, searchable, beautifully structured wiki for:</p>
                        </div>
                        <ul>
                            <BlogList className="my-1">Movies</BlogList>
                            <BlogList className="my-1">Shows</BlogList>
                            <BlogList className="my-1">Artists</BlogList>
                            <BlogList className="my-1">Characters</BlogList>
                            <BlogList className="my-1">Companies</BlogList>
                            <BlogList className="my-1">Networks</BlogList>
                            <BlogList className="my-1">Genres</BlogList>
                            <BlogList className="my-1">and more</BlogList>
                        </ul>
                        <p>Every taleon has its own dedicated wiki page with details, credits, ratings, genres, release years, related content, and <strong>threads created by the community</strong>.</p>
                        <p>Wiki pages are the starting point - from there, users dive into discussions, threads, and shelves.</p>
                    </BlogSubSection>

                    <BlogSubSection className="my-8">
                        <div>
                            <BlogHeading3>2. Threads</BlogHeading3>
                            <p className="mt-2 text-sm">Threads are dedicated discussion hubs created on topics like:</p>
                        </div>
                        <ul>
                            <BlogList>Specific movies and shows</BlogList>
                            <BlogList>Artists</BlogList>
                            <BlogList>Characters</BlogList>
                            <BlogList>Franchises</BlogList>
                            <BlogList>Fan theories</BlogList>
                            <BlogList>Analysis and breakdowns</BlogList>
                        </ul>
                        <p>Thread creators can assign <strong>moderators</strong> to maintain clean and friendly discussions, making each thread feel like a curated mini-community.</p>
                    </BlogSubSection>

                    <BlogSubSection className="my-8">
                        <div>
                            <BlogHeading3>3. Posts</BlogHeading3>
                            <p className="mt-2 text-sm">Every discussion starts with a post. Types of posts include:</p>
                        </div>

                        <BlogSubSection>
                            <p className="text-semibold">Text Based:</p>
                            <ul>
                                <BlogList>Discussions</BlogList>
                                <BlogList>Questions</BlogList>
                                <BlogList>Jokes / Roasts</BlogList>
                                <BlogList>Facts & Information</BlogList>
                                <BlogList>Theories & Speculations</BlogList>
                            </ul>
                        </BlogSubSection>

                        <BlogSubSection>
                            <p className="text-semibold">Frame Based:</p>
                            <ul>
                                <BlogList>Images like Wallpapers, etc.</BlogList>
                                <BlogList>Videos like Movie Clips, etc.</BlogList>
                            </ul>
                        </BlogSubSection>

                        <BlogSubSection>
                            <p className="text-semibold">Additional features:</p>
                            <ul>
                                <BlogList>NSFW & Spoiler tagging</BlogList>
                                <BlogList>Age-appropriate content control</BlogList>
                                <BlogList>Reactions & comments</BlogList>
                                <BlogList>Clean spoiler-safe and NSFW-safe viewing</BlogList>
                                <BlogList>Automatic filtering for under-aged users</BlogList>
                            </ul>
                        </BlogSubSection>

                        <p>Posts feel expressive, interactive, and tailored for cine culture.</p>
                    </BlogSubSection>

                    <BlogSubSection className="my-8">
                        <div>
                            <BlogHeading3>4. Comments & Replies</BlogHeading3>
                            <p className="mt-2 text-sm">Users can comment directly on posts or reply to other comments.</p>
                        </div>
                        <ul>
                            <BlogList>Like comments</BlogList>
                            <BlogList>Tag comments as Spoiler or NSFW</BlogList>
                            <BlogList>Clean spoiler-safe hiding system</BlogList>
                            <BlogList>Easy conversation tracking</BlogList>
                        </ul>
                        <p>The comment system makes discussions feel alive and organized.</p>
                    </BlogSubSection>

                    <BlogSubSection className="my-8">
                        <div>
                            <BlogHeading3>5. Shelves</BlogHeading3>
                            <p className="mt-2 text-sm">Shelves allow users to collect, organize, and share taleons. They{`'`}re your personal movie diary - refined and social.</p>
                        </div>

                        <BlogSubSection>
                            <p>Every user gets three built-in shelves:</p>
                            <ul>
                                <BlogList>Favorites - Taleons you love</BlogList>
                                <BlogList>Watched - Your watch history</BlogList>
                                <BlogList>Recommended - To share suggestions with others</BlogList>
                            </ul>
                        </BlogSubSection>

                        <BlogSubSection>
                            <p>Plus, users can create custom shelves with:</p>
                            <ul>
                                <BlogList>Private or Public visibility</BlogList>
                                <BlogList>Collaborators chosen from followers</BlogList>
                                <BlogList>Folder-like organization</BlogList>
                                <BlogList>Shareable collections</BlogList>
                            </ul>
                        </BlogSubSection>

                        <p>Shelves become a beautiful reflection of your journey with cinema.</p>
                    </BlogSubSection>

                    <BlogSubSection className="mt-8">
                        <div>
                            <BlogHeading3>6. Real-Time Experience</BlogHeading3>
                            <p className="mt-2 text-sm">Parlocula feels alive with:</p>
                        </div>
                        <ul>
                            <BlogList>Real-time chatting</BlogList>
                            <BlogList>Instant notifications</BlogList>
                            <BlogList>Push notifications for everything important</BlogList>
                            <BlogList>Typing indicators, online status, and quick messaging tools</BlogList>
                        </ul>
                        <p>It{"'"}s social, dynamic, and fast - not another static app.</p>
                    </BlogSubSection>
                </BlogSection>

                <BlogSection>
                    <BlogHeading2>The Heart of Parlocula</BlogHeading2>
                    <BlogSubSection className="space-y-2">
                        <p>At its core, Parlocula is a community. A place where people who love movies and shows can:</p>
                        <ul>
                            <BlogList>Express themselves</BlogList>
                            <BlogList>Learn from each other</BlogList>
                            <BlogList>Share stories</BlogList>
                            <BlogList>Discover new favorites</BlogList>
                            <BlogList>Celebrate characters, artists, and cinematic universes</BlogList>
                            <BlogList>And connect with people who feel the same way</BlogList>
                        </ul>
                    </BlogSubSection>
                    <p>Friendly. Passionate. Youth-driven. Built by us, used by us.</p>
                </BlogSection>

                <ParloFooter />
            </main>
        </>
    )

}

export default AppAboutPage;