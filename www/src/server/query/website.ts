import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"

export const getWebsite = async () => {
    const user = await getCurrentUser()
    if (!user) {
        throw new Error('User not found')
    }
    const website = await db.website.findMany({
        where: {
            userId: user.id,
        },
        include: {
            WebSession: {
                distinct: ["visitorId"],
                where: {
                    createdAt: {
                        gte: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
                    },
                },
                select: {
                    id: true,
                },
            },
        },
    })
    const ids = website.map((website) => website.id)
    const teamWebsites = await db.teamWebsite.findMany({
        where: {
            Team: {
                AND: {
                    TeamUser: {
                        some: {
                            userId: user.id,
                        },
                    },
                    TeamWebsite: {

                        some: {
                            websiteId: {
                                notIn: ids
                            }
                        }
                    }
                }

            },
        },
        include: {
            Website: {
                include: {
                    WebSession: {
                        distinct: ["visitorId"],
                        where: {
                            createdAt: {
                                gte: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
                            },
                        },
                        select: {
                            id: true,
                        },
                    },
                },
            },
        },
    })
    const websites = [
        website,
        teamWebsites.map((teamWebsite) => ({
            ...teamWebsite.Website,
        }))
    ].reduce((acc, val) => acc.concat(val), [])
    return websites
}

export type Websites = Awaited<ReturnType<typeof getWebsite>>

