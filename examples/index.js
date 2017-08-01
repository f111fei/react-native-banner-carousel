import React from 'react';
import {
    AppRegistry,
    View,
    Image,
    Dimensions
} from 'react-native';

import Carousel from 'react-native-banner-carousel';

const BannerWidth = Dimensions.get('window').width;
const BannerHeight = 260;

const images = [
    "http://img.qdaily.com/article/banner/20170801113352Nruq7ySUiAh8e3L1.jpg?imageMogr2/auto-orient/thumbnail/!640x380r/gravity/Center/crop/640x380/quality/85/format/jpg/ignore-error/1",
    "http://img.qdaily.com/article/banner/201707312210334UMcDGil9SnKWh1o.jpg?imageMogr2/auto-orient/thumbnail/!640x380r/gravity/Center/crop/640x380/quality/85/format/jpg/ignore-error/1",
    "http://img.qdaily.com/article/banner/20170731145444Awq5zJK7Tok2sC3V.jpg?imageMogr2/auto-orient/thumbnail/!640x380r/gravity/Center/crop/640x380/quality/85/format/jpg/ignore-error/1"
];

var carousel = React.createClass({
    renderPage(image) {
        return (
            <View>
                <Image style={{ width: BannerWidth, height: BannerHeight }} source={{ uri: image }} />
            </View>
        );
    },
    render: function () {
        return (
            <Carousel
                autoplay
                autoplayTimeout={5000}
                loop
                index={0}
                pageSize={BannerWidth}
            >
                {images.map(image => this.renderPage(image))}
            </Carousel>
        )
    }
})

AppRegistry.registerComponent('carousel', () => carousel);