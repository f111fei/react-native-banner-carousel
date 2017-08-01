# react-native-banner-carousel

Swiper component for React Native. Compatible with Android & iOS. Pull requests are very welcome!

## Show Case

![](images/showcase.gif)

## Install

    $ npm install --save react-native-banner-carousel

## Usage
        
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
        "http://xxx.com/1.png",
        "http://xxx.com/2.png",
        "http://xxx.com/3.png"
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

## Properties

### Base

| Prop  | Default  | Type | Description |
| :------------ |:---------------:| :---------------:| :-----|
| **pageSize** | windowWidth | `number` | the size of carousel page, must be the same for all of them. Required with horizontal carousel.  |
| loop | true | `bool` | Set to `false` to disable continuous loop mode. |
| index | 0 | `number` | Index number of initial slide. |
| autoplay | false | `bool` | Set to `true` enable auto play mode. |
| autoplayTimeout | 5000 | `number` | Delay between auto play transitions (in Millisecond). |
| animation | - | `func` | function that returns a React Native Animated configuration. `(animate: Animated.Value, toValue: number) => Animated.CompositeAnimation;` |
| onPageChanged | - | `func` | page change callback. `(index: number) => void;` |

### Pagination

| Prop  | Default  | Type | Description |
| :------------ |:---------------:| :---------------:| :-----|
| showsPageIndicator | true | `bool` | Set to true make pagination indicator visible.  |
| pageIndicatorStyle | - | `style` | Custom styles will merge with the default styles. |
| activePageIndicatorStyle | - | `style` | Custom styles will merge with the default styles. |
| renderPageIndicator | - | `func` | Complete control how to render pagination. `(config: PageIndicatorConfig) => JSX.Element;`. |

#### PageIndicatorConfig

    interface PageIndicatorConfig {
        pageNum: number;
        childrenNum: number;
        loop: boolean;
        scrollValue: Animated.Value;
    }


#### Custom Pagination Indicator

Here is an example for custom pagination indicator:

    renderIndicator(config: PageIndicatorConfig) {
        const { childrenNum, pageNum, loop, scrollValue } = config;
        if (pageNum === 0) {
            return null;
        }

        const indicators: JSX.Element[] = [];
        for (let i = 0; i < pageNum; i++) {
            indicators.push(<View key={i} style={[styles.pageIndicatorStyle, this.props.pageIndicatorStyle]} />);
        }

        let left: Animated.AnimatedInterpolation;

        if (pageNum === 1) {
            left = this.state.scrollValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0]
            });
        } else if (!loop) {
            left = this.state.scrollValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 16]
            });
        } else {
            left = this.state.scrollValue.interpolate({
                inputRange: [0, 1, 2, childrenNum - 2, childrenNum - 1],
                outputRange: [0, 0, 16, 16 * (childrenNum - 3), 16 * (childrenNum - 3)]
            });
        }

        return (
            <View style={{ position: 'absolute', alignSelf: 'center', flexDirection: 'row', bottom: 10 }}>
                {indicators}
                <Animated.View
                    style={[
                        this.props.pageIndicatorStyle, this.props.activePageIndicatorStyle,
                        { left: left }
                    ]}
                />
            </View>
        );
    }