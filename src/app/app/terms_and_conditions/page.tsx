import { Navbar, Navigate } from "@components";
import { BlogHeading1, BlogHeading2, BlogHeading3, BlogList, BlogSection, BlogSubSection } from "@components/blog";
import { ParloFooter } from "@components/ui";
import generateDynamicMetadata from "@lib/shared/seo/metadata";

export const dynamic = "force-static";

export const metadata = generateDynamicMetadata({ title: "Terms And Conditions" });

const TermsAndConditionsPage = () => {

    return (
        <>
            <Navbar />

            <main className="noPadding px-4 py-6">
                <header className="my-8">
                    <BlogHeading1>Terms & Conditions - Parlocula</BlogHeading1>

                    <BlogSubSection>
                        <p><strong>Last Updated:</strong> Tue, June 16 2026</p>
                    </BlogSubSection>
                </header>

                <BlogSection>
                    <BlogHeading2>1. Introduction</BlogHeading2>
                    <BlogSubSection>
                        <p>
                            Welcome to <strong>Parlocula</strong>, a community-based platform for people who love movies and shows (together called <strong>{`"`}Taleons{`"`}</strong>) and enjoy discussing, sharing, reviewing, and collecting them.
                        </p>
                        <p>
                            By using Parlocula, you agree to follow these Terms & Conditions ({`"`}Terms{`"`}).
                        </p>
                        <p>
                            “We”, “us”, and “our” refer to <strong>everyone working on Parlocula</strong>, whether it is one person or a team.
                        </p>
                    </BlogSubSection>
                </BlogSection>

                <BlogSection>
                    <BlogHeading2>2. Age Requirement</BlogHeading2>
                    <BlogSubSection>
                        <p>You must be <strong>13 years old or above</strong> to create an account or use Parlocula.</p>
                        <p>By creating an account, you confirm that you meet the minimum age requirement.</p>
                    </BlogSubSection>
                </BlogSection>

                <BlogSection>
                    <BlogHeading2>3. Your Account</BlogHeading2>
                    <BlogSubSection>
                        <p>To use Parlocula, you must create an account with accurate and complete information. You agree to:</p>
                        <ul>
                            <BlogList>Keep your login credentials secure</BlogList>
                            <BlogList>Be responsible for all activity under your account</BlogList>
                            <BlogList>Sign up using only and correct email</BlogList>
                            <BlogList>Inform us immediately if your account is accessed without permission</BlogList>
                        </ul>
                        <p>We reserve the right to suspend or terminate accounts that violate these Terms or create risks to the platform.</p>
                    </BlogSubSection>

                    <BlogSubSection>
                        <BlogHeading3>Username and Profile Rules</BlogHeading3>

                        <p>Usernames must not:</p>
                        <ul>
                            <BlogList>Be “Guest”</BlogList>
                            <BlogList>Start with “theparlocula”</BlogList>
                            <BlogList>Be NSFW (explained below)</BlogList>
                        </ul>
                        <p>Other rules:</p>
                        <BlogList>
                            We recommend using at least one symbol (like an underscore) or a number in your username.
                        </BlogList>
                        <BlogList>Profile pictures must not contain NSFW content.</BlogList>
                        <BlogList>Breaking these may lead to a permanent ban.</BlogList>
                    </BlogSubSection>
                </BlogSection>

                <BlogSection>
                    <BlogHeading2>4. What NSFW Means</BlogHeading2>
                    <BlogSubSection>
                        <p>NSFW (Not Safe For Work) includes:</p>
                        <ul>
                            <BlogList>Graphic nudity (even blurred)</BlogList>
                            <BlogList>Sexual content of any kind</BlogList>
                            <BlogList>Highly explicit language</BlogList>
                            <BlogList>Strong Profanity</BlogList>
                            <BlogList>Visible Blood or gore (even black/white)</BlogList>
                        </ul>
                        <p>Users can post NSFW content <strong>only if they mark it as NSFW</strong>.</p>
                        <p>Posting Unmarked NSFW contents may lead to temporary or <strong>permanent bans</strong>.</p>
                    </BlogSubSection>
                </BlogSection>

                <BlogSection>
                    <BlogHeading2>5. Content Rules (UGC - User Generated Content)</BlogHeading2>
                    <p className="my-3">Parlocula allows users to post discussions, opinions, reviews, wallpapers, theories, clips, and more.</p>

                    <BlogSubSection>
                        <BlogHeading3>Allowed Content</BlogHeading3>
                        <ul>
                            <BlogList>Honest opinions</BlogList>
                            <BlogList>Reviews, discussions, debates, sarcasm, jokes</BlogList>
                            <BlogList>Strong language or profanity (must be marked NSFW)</BlogList>
                            <BlogList>Soft Roasting - as long as they do not become abusive</BlogList>
                        </ul>
                    </BlogSubSection>

                    <BlogSubSection>
                        <BlogHeading3>Not Allowed</BlogHeading3>
                        <ul>
                            <BlogList>Abusive or threatening words</BlogList>
                            <BlogList>Hate speech or hate spreading</BlogList>
                            <BlogList><strong>Unmarked NSFW content</strong></BlogList>
                            <BlogList>
                                Spamming, including:
                                <ul>
                                    <BlogList>Posting the same thing repeatedly</BlogList>
                                    <BlogList>Creating duplicate threads</BlogList>
                                </ul>
                            </BlogList>
                            <BlogList>Promotional or commercial posts <strong>(lead to permanent ban)</strong></BlogList>
                        </ul>
                    </BlogSubSection>

                    <BlogSubSection>
                        <BlogHeading3>NSFW Content Rules</BlogHeading3>
                        <ul>
                            <BlogList>Any NSFW words or images must be marked NSFW</BlogList>
                            <BlogList>Thread posters (cover images) must never be NSFW.</BlogList>
                            <BlogList>Profile pictures, usernames, and display names must never contain any NSFW.</BlogList>
                            <BlogList><strong>Unmarked NSFW content</strong> will leade to termination</BlogList>
                        </ul>
                    </BlogSubSection>

                    <BlogSubSection>
                        <BlogHeading3>Moderation</BlogHeading3>
                        <p>We may remove:</p>
                        <ul>
                            <BlogList>Content that breaks rules</BlogList>
                            <BlogList>Harassing or harmful contents</BlogList>
                            <BlogList>Reported contents that violates any terms</BlogList>
                        </ul>
                    </BlogSubSection>

                    <BlogSubSection>
                        <BlogHeading3>Visibility for Underage Users</BlogHeading3>
                        <p>
                            Users who are under 18 or who disable NSFW content will automatically see <strong>filtered content</strong>.
                        </p>
                    </BlogSubSection>

                    <BlogSubSection>
                        <BlogHeading3>External Sharing</BlogHeading3>
                        <p>Any public content on Parlocula can be shared outside the app.</p>
                    </BlogSubSection>
                </BlogSection>

                <BlogSection>
                    <BlogHeading2>6. Direct Messages</BlogHeading2>
                    <BlogSubSection>
                        <p>You may send and receive private messages (“DMs”) within the platform.</p>
                        <p>However, please note:</p>
                        <ul>
                            <BlogList>Other users may screenshot or share chat content</BlogList>
                            <BlogList>We may review DMs only when required for safety, legal compliance, or investigating abuse</BlogList>
                            <BlogList>You must not share any personal or private information wiyh any stranger</BlogList>
                        </ul>
                        <p>We treat private communication with confidentiality but cannot guarantee absolute privacy.</p>
                    </BlogSubSection>
                </BlogSection>

                <BlogSection>
                    <BlogHeading2>7. Shelves, Threads & Activity</BlogHeading2>
                    <BlogSubSection>
                        <p>Parlocula allows you to create shelves, participate in community threads, and post reactions and discussions.</p>
                        <p>You understand that:</p>
                        <ul>
                            <BlogList>Your public activities are visible to other users</BlogList>
                            <BlogList>Content deleted by you may remain in backups for a limited time</BlogList>
                            <BlogList>Any Public content on this app, either created by you or not, can be shared outside of this app.</BlogList>
                            <BlogList>We may moderate or remove content that violates policies</BlogList>
                        </ul>
                        <p>Users can create shelves to track or share collections.</p>
                        <p>All shelves are user-controlled <strong>except the “Recommendation” shelf</strong>, which is always public.</p>
                    </BlogSubSection>
                </BlogSection>

                <BlogSection>
                    <BlogHeading2>8. Wiki Pages & Licensing</BlogHeading2>
                    <BlogSubSection>
                        <p>Some information shown on Parlocula comes from <strong>TMDB</strong>.</p>
                        <p>TMDB is not responsible for anything on Parlocula, and the data may not always be perfect or complete.</p>
                    </BlogSubSection>
                </BlogSection>

                <BlogSection>
                    <BlogHeading2>9. Behavioral Guidelines</BlogHeading2>
                    <BlogSubSection>
                        <p>We want Parlocula to be safe and friendly.</p>
                        <BlogHeading3>Not Allowed:</BlogHeading3>
                        <ul>
                            <BlogList>
                                <strong>Harassment or bullying</strong> - Light-hearted roasting is okay, but hurting someone intentionally or repeatedly can lead to temporary or permanent ban.
                            </BlogList>
                            <BlogList>
                                <strong>Spamming or duplicate threads</strong> - It may result in temporary and, if repeted, permanent banned from the app.
                            </BlogList>
                            <BlogList>
                                <strong>Promotional or commercial content</strong> - Parlocula is a community based application for entertainment purpose, not for commercial purpose.
                            </BlogList>
                        </ul>
                        <p>Breaking these rules may result in temporary or permanent bans.</p>
                    </BlogSubSection>
                </BlogSection>

                <BlogSection>
                    <BlogHeading2>10. Data & Privacy</BlogHeading2>
                    <BlogSubSection>
                        <p>We <strong>do not</strong> sell your data.</p>
                        <p>We only collect what is necessary to run the Parlocula smoothly, such as:</p>
                        <ul>
                            <BlogList>Email (for notifications)</BlogList>
                            <BlogList>Cookies (for sessions)</BlogList>
                            <BlogList>Device fingerprint (for uniqueness and safety)</BlogList>
                        </ul>
                    </BlogSubSection>
                </BlogSection>

                <BlogSection>
                    <BlogHeading2>11. Payments</BlogHeading2>
                    <BlogSubSection>
                        <p>Parlocula is completely <strong>free</strong>. There are no paid features, subscriptions, or charges.</p>
                        <p>There are:</p>
                        <ul>
                            <BlogList>No paid features</BlogList>
                            <BlogList>No subscriptions</BlogList>
                            <BlogList>No premium memberships</BlogList>
                        </ul>

                        <p>Parlocula does not ask you to pay any amount of fee for any features or premium membership. If anyone asks you to pay money under the name “Parlocula”, do not pay them.</p>
                    </BlogSubSection>
                </BlogSection>

                <BlogSection>
                    <BlogHeading2>12. User Content Rights</BlogHeading2>
                    <BlogSubSection>
                        <p>You own the content you post.</p>
                        <p>By posting on Parlocula, you give us permission to:</p>
                        <ul>
                            <BlogList>Display your content</BlogList>
                            <BlogList>Store backups</BlogList>
                            <BlogList>Show it in threads, feeds, shelves, and related areas</BlogList>
                            <BlogList>Process it for platform features</BlogList>
                        </ul>
                        <p>We do not claim ownership of your content. We only use it to operate Parlocula.</p>
                    </BlogSubSection>

                </BlogSection>

                <BlogSection>
                    <BlogHeading2>13. Liability & Disclaimers</BlogHeading2>

                    <BlogSubSection>
                        <BlogHeading3>We Want Parlocula to Be Safe</BlogHeading3>
                        <p>Parlocula is built with care, and we always try to keep it safe, stable, and enjoyable.</p>
                        <p>However, no online service can be perfect. Sometimes there may be:</p>
                        <ul>
                            <BlogList>Bugs</BlogList>
                            <BlogList>Incorrect information</BlogList>
                            <BlogList>Slow performance</BlogList>
                            <BlogList>Harmful posts from other users</BlogList>
                        </ul>
                    </BlogSubSection>

                    <BlogSubSection>
                        <BlogHeading3>About User Content</BlogHeading3>
                        <p>Most of the content on Parlocula such as posts, comments, and threads come from users, not us.</p>
                        <p>We are not legally responsible for what other users post, but <strong>we actively moderate</strong> the platform and remove harmful, abusive, or reported content as quickly as possible.</p>
                    </BlogSubSection>

                    <BlogSubSection>
                        <BlogHeading3>Community Responsibility</BlogHeading3>
                        <p>Parlocula is a shared community, everone here are responsible to keep us safe and secure:</p>

                        <ul>
                            <BlogList>
                                <strong>Your job:</strong> report harmful or rule-breaking content.
                            </BlogList>
                            <BlogList>
                                <strong>Our job:</strong> review and take actions.
                            </BlogList>
                        </ul>
                    </BlogSubSection>

                    <BlogSubSection>
                        <BlogHeading3>No Liability for Damages</BlogHeading3>
                        <p>We are not responsible for:</p>
                        <ul>
                            <BlogList>Losses caused by other users</BlogList>
                            <BlogList>Incorrect information</BlogList>
                            <BlogList>NSFW content that you choose to view</BlogList>
                            <BlogList>Technical problems</BlogList>
                            <BlogList>Issues caused by external services (like TMDB)</BlogList>
                        </ul>
                    </BlogSubSection>
                    <p>We actively moderate and continuously try to improve the platform.</p>
                    <p>By using Parlocula, you agree that you will not hold the Parlocula team responsible for such issues.</p>
                </BlogSection>

                <BlogSection>
                    <BlogHeading2>14. Termination Rules</BlogHeading2>
                    <BlogSubSection>
                        <p>We may suspend or permanently ban an account if the user:</p>
                        <ul>
                            <BlogList>Spams or creates duplicate threads</BlogList>
                            <BlogList>Uses abusive language</BlogList>
                            <BlogList>Harasses others</BlogList>
                            <BlogList>Posts hate speech</BlogList>
                            <BlogList>Pretends to be someone else</BlogList>
                            <BlogList>Posts NSFW content without marking it properly</BlogList>
                            <BlogList>Uses NSFW usernames, names, profile pictures, or thread posters</BlogList>
                        </ul>
                    </BlogSubSection>
                </BlogSection>

                <BlogSection>
                    <BlogHeading2>15. Platform Rules</BlogHeading2>
                    <BlogSubSection>
                        <p>By using the Service, you agree not to:</p>
                        <ul>
                            <BlogList>
                                Interfere with servers, APIs, or security features
                            </BlogList>
                            <BlogList>
                                Attempt to reverse engineer, scrape, or extract platform data
                            </BlogList>
                            <BlogList>
                                Impersonate others
                            </BlogList>
                            <BlogList>
                                Create fake or automated accounts
                            </BlogList>
                            <BlogList>
                                Circumvent bans or restrictions
                            </BlogList>
                        </ul>
                        <p>Violation of these rules may result in termination of your account.</p>
                    </BlogSubSection>
                </BlogSection>

                <BlogSection>
                    <BlogHeading2>16. Intellectual Property</BlogHeading2>
                    <BlogSubSection>
                        <p>All platform features, logos, design elements, and software are owned by us.</p>
                        <p>You must not:</p>
                        <ul>
                            <BlogList>
                                Copy, modify, distribute, or sell any part of the platform
                            </BlogList>
                            <BlogList>
                                Use our branding without permission
                            </BlogList>
                            <BlogList>
                                Create derivative works from our code or design
                            </BlogList>
                        </ul>
                        <p>Your Content remains yours, but the platform itself is protected.</p>
                    </BlogSubSection>
                </BlogSection>

                <BlogSection>
                    <BlogHeading2>17. Changes to These Terms</BlogHeading2>
                    <BlogSubSection>
                        <p>We may update these Terms & Conditions at any time.</p>
                        <p>
                            If we do, we will update the date at the top of this page. Continuing to use Parlocula means you accept the new terms.
                        </p>
                    </BlogSubSection>
                </BlogSection>

                <BlogSection>
                    <BlogHeading2>18. Contact</BlogHeading2>
                    <BlogSubSection>
                        <p>If you have any questions about these Terms, you can contact us at:</p>
                        <Navigate comp="link" goto="mailto:contact.qcore@gmail.com" className="underline">
                            contact.qcore@gmail.com
                        </Navigate>
                    </BlogSubSection>
                </BlogSection>

                <ParloFooter />
            </main>
        </>
    )


}

export default TermsAndConditionsPage;