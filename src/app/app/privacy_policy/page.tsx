import { Navbar } from "@components";
import { BlogHeading1, BlogHeading2, BlogHeading3, BlogList, BlogSection, BlogSubSection } from "@components/blog";
import { ParloFooter } from "@components/ui";
import generateDynamicMetadata from "@lib/shared/seo/metadata";
import Link from "next/link";

export const dynamic = "force-static";

export const metadata = generateDynamicMetadata({ title: "Privacy Policy" });

const PrivacyPolicyPage = () => {

    return (
        <>
            <Navbar />

            <main className="noPadding px-4 py-6">

                <header className="my-8">
                    <BlogHeading1>Privacy Policy - Parlocula</BlogHeading1>

                    <BlogSubSection>
                        <p>
                            <strong>Last Updated: Sat Nov 23 2025</strong>
                        </p>
                        <p>
                            This Privacy Policy explains how we collect, use, store, and protect your information when you use our community-based platform built for sharing, discussing, and exploring movies and shows ({'"'}Taleons{'"'}). By creating an account or using any part of the platform, you agree to the practices described below.
                        </p>
                    </BlogSubSection>
                </header>

                <BlogSection>
                    <BlogHeading2>1. Information We Collect</BlogHeading2>
                    <p className="mt-2">We collect the following types of information to provide and improve our services:</p>

                    <BlogSubSection>
                        <BlogHeading3>A. Account Information</BlogHeading3>
                        <p>When you create an account, we collect:</p>
                        <ul>
                            <BlogList>Email Address</BlogList>
                            <BlogList>Username</BlogList>
                            <BlogList>Name</BlogList>
                            <BlogList>Date of birth</BlogList>
                            <BlogList>Profile Picture (optional)</BlogList>
                            <BlogList>Biography (optional)</BlogList>
                        </ul>
                        <p>This information allows us to identify you, secure your account, and personalize your experience.</p>
                    </BlogSubSection>

                    <BlogSubSection>
                        <BlogHeading3>B. Activity Data</BlogHeading3>
                        <p>When you use the platform, we collect content you choose to create or interact with, including:</p>
                        <ul>
                            <BlogList>Posts</BlogList>
                            <BlogList>Comments</BlogList>
                            <BlogList>Reactions and Likes</BlogList>
                            <BlogList>Frames (images and videos)</BlogList>
                            <BlogList>Direct Messages</BlogList>
                        </ul>
                        <p>This information enables core platform features such as discussions, community engagement, personalization, and content creation.</p>
                    </BlogSubSection>

                    <BlogSubSection>
                        <BlogHeading3>C. Device & Usage Data</BlogHeading3>
                        <p>For security, authentication, and platform integrity, we collect:</p>
                        <ul>
                            <BlogList>Device fingerprint (used only for uniqueness and secure token handling)</BlogList>
                        </ul>
                        <p>This helps us prevent unauthorized access and ensure a safe user environment.</p>
                        <p>We <strong>do not</strong> collect analytics, tracking data, or behavioral profiling information.</p>
                    </BlogSubSection>
                </BlogSection>

                <BlogSection>
                    <BlogHeading2>2. How We Use Your Information</BlogHeading2>
                    <BlogSubSection>
                        <p>We use your information only for purposes directly related to the functioning of the platform, including:</p>
                        <ul>
                            <BlogList>Enabling you to create posts, comment, interact, and participate in threads</BlogList>
                            <BlogList>Maintaining shelves, frames, and other user-generated content</BlogList>
                            <BlogList>Protecting the community by detecting spam, abuse, and harmful behavior</BlogList>
                            <BlogList>Enabling communication features such as direct messages</BlogList>
                            <BlogList>Securing user sessions and accounts</BlogList>
                        </ul>
                        <p>We <strong>do not</strong> use your data for advertising, behavioral tracking, or analytics.</p>
                    </BlogSubSection>
                </BlogSection>

                <BlogSection>
                    <BlogHeading2>3. Third-Party Services</BlogHeading2>
                    <BlogSubSection>
                        <p>We use trusted service providers to run essential parts of the platform. These services only access data required to perform their functions:</p>
                        <ul>
                            <BlogList>MongoDB Atlas - Database storage</BlogList>
                            <BlogList>Firebase - Hosting infrastructure</BlogList>
                            <BlogList>Cloudinary & Mega - Media storage and delivery</BlogList>
                            <BlogList>Ably - Real-time features such as live updates and interactions</BlogList>
                        </ul>
                        <p>These providers act as data processors and operate under their own privacy and security policies.</p>
                    </BlogSubSection>
                </BlogSection>

                <BlogSection>
                    <BlogHeading2>4. How We Store & Protect Your Data</BlogHeading2>
                    <BlogSubSection>
                        <p>We use industry-standard security practices to safeguard your information and prevent unauthorized access. Session tokens are stored in <strong>secure, HTTP-only cookies</strong> to prevent client-side access and protect user accounts.</p>
                        <p>Content you upload (such as media files) is stored using secure third-party cloud storage services.</p>
                    </BlogSubSection>
                </BlogSection>

                <BlogSection>
                    <BlogHeading2>5. Sharing of Information</BlogHeading2>
                    <BlogSubSection>
                        <p>We <strong>do not sell, share, or rent</strong> your personal information to any third parties.</p>
                        <p>Information may only be disclosed if required by law, to comply with legal obligations, or to protect the rights and safety of our users and platform.</p>
                    </BlogSubSection>
                </BlogSection>

                <BlogSection>
                    <BlogHeading2>6. User Rights</BlogHeading2>
                    <BlogSubSection>
                        <p>As a user of the platform, you have the right to:</p>
                        <ul>
                            <BlogList>
                                <strong>A. Delete Your Account & Data</strong>
                                <BlogSubSection>
                                    <p>You can request deletion of your account and associated data.</p>
                                    <p>This permanently removes your profile, shelves, messages, bookmarks and most associated data <strong>except</strong> Posts, Comments, Reactions on Posts and Likes on Comments as they belong to the thread they are created in.</p>
                                    <p>However, if you want to remove them as well, you can individually delete them and then request for deletion of your account.</p>
                                </BlogSubSection>
                            </BlogList>
                            <BlogList>
                                <strong>B. Request Corrections</strong>
                                <p className="mt-2">
                                    You may request corrections or modifications to your account information if it is inaccurate or incomplete.
                                </p>
                            </BlogList>
                        </ul>
                        <p>We do not perform analytics, so there is no tracking data to opt out of.</p>
                        <p>To exercise these rights, you may contact us using the information provided below.</p>
                    </BlogSubSection>
                </BlogSection>

                <BlogSection>
                    <BlogHeading2>7. Cookies & Local Storage</BlogHeading2>
                    <BlogSubSection>
                        <BlogHeading3>A. Cookies</BlogHeading3>
                        <p>We use cookies to:</p>
                        <ul>
                            <BlogList>Manage login sessions</BlogList>
                            <BlogList>Store secure session tokens</BlogList>
                            <BlogList>Support basic platform functionality</BlogList>
                        </ul>
                        <p>All authentication cookies are <strong>HTTP-only and secure</strong>.</p>
                    </BlogSubSection>
                    <BlogSubSection>
                        <BlogHeading3>B. IndexedDB</BlogHeading3>
                        <p>IndexedDB is used to store certain non-sensitive data locally on your device to improve speed and offline experience.</p>
                    </BlogSubSection>
                </BlogSection>

                <BlogSection>
                    <BlogHeading2>8. Age Restrictions</BlogHeading2>
                    <BlogSubSection>
                        <p>The platform is intended for individuals <strong>13 years of age or older</strong>.</p>
                        <p>If we learn that someone under 13 has created an account, we may delete the account to comply with safety standards.</p>
                    </BlogSubSection>
                </BlogSection>

                <BlogSection>
                    <BlogHeading2>9. Data Security</BlogHeading2>
                    <BlogSubSection>
                        <p>We implement reasonable technical and organizational safeguards to protect your data from unauthorized access, alteration, disclosure, or destruction.</p>
                        <p>This includes secure token handling, device-based uniqueness detection, and restricted access to sensitive systems.</p>
                        <p>Despite these measures, no online platform can guarantee absolute security.</p>
                    </BlogSubSection>
                </BlogSection>

                <BlogSection>
                    <BlogHeading2>10. Contact Information</BlogHeading2>
                    <BlogSubSection>
                        <p>For privacy-related questions, concerns, or requests, you may contact us at:</p>

                        <Link href="mailto:contact.qcore@gmail.com" className="inline underline">
                            contact.qcore@gmail.com
                        </Link>

                    </BlogSubSection>
                </BlogSection>

                <BlogSection>
                    <BlogHeading2>11. Changes to This Privacy Policy</BlogHeading2>
                    <BlogSubSection>
                        <p>We may update this Privacy Policy from time to time.</p>
                        <p>When updates are made, the {'"'}Last Updated{'"'} date will be revised accordingly. Continued use of the platform after changes are posted means you accept the updated policy.</p>
                    </BlogSubSection>
                </BlogSection>

                <ParloFooter />

            </main>
        </>
    )
}

export default PrivacyPolicyPage;