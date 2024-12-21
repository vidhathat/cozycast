export const filterFeedBasedOnFID = (feed, lower_limit_feed = 0, upper_limit_feed = Infinity) => {
    if (!feed || feed.length === 0) {
        return [];
    }

    const lower = lower_limit_feed ?? 0;
    const upper = upper_limit_feed ?? Infinity;

    return feed.filter((item) => {
        const fid = item?.author?.fid;
        return fid !== undefined && fid >= lower && fid <= upper;
    });
}

const getChannelIdFromUrl = (channelUrl = "") => {
    // "parent_url": "https://warpcast.com/~/channel/degentokenbase"
    if (!channelUrl) {
        return null
    }
    const channelId = channelUrl.split('/').pop()
    return channelId
}

export const filterCastsBasedOnChannels = (casts, channels) => {
    if (!casts || casts.length === 0 || !channels || channels.length === 0) {
        return [];
    }

    return casts.filter((cast) => {
        const channelId = getChannelIdFromUrl(cast?.parent_url);
        return channelId && channels.includes(channelId);
    });
}

export const filterCastsToMute = (casts, mutedChannels) => {
    if (!casts || casts.length === 0 || !mutedChannels || mutedChannels.length === 0) {
        return casts;
    }

    return casts.filter((cast) => {
        const channelId = getChannelIdFromUrl(cast?.parent_url);
        return channelId && !mutedChannels.includes(channelId);
    });
}