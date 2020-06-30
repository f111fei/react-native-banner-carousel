import * as React from 'react';
import {
    View, Animated, ScrollView, StyleSheet, ViewStyle, Platform, Dimensions,
    PanResponder, PanResponderInstance, PanResponderGestureState
} from 'react-native';

export interface PageIndicatorConfig {
    pageNum: number;
    childrenNum: number;
    loop: boolean;
    scrollValue: Animated.Value;
}

export interface CarouselProps {
    pageSize: number;
    loop?: boolean;
    index?: number;
    autoplay?: boolean;
    autoplayTimeout?: number;
    slipFactor?: number;
    animation?: (animate: Animated.Value, toValue: number) => Animated.CompositeAnimation;
    onPageChanged?: (index: number) => void;
    showsPageIndicator?: boolean;
    renderPageIndicator?: (config: PageIndicatorConfig) => JSX.Element;
    pageIndicatorContainerStyle?: ViewStyle;
    activePageIndicatorStyle?: ViewStyle;
    pageIndicatorStyle?: ViewStyle;
    pageIndicatorOffset?: number;
}

export interface CarouselState {
    scrollValue: Animated.Value;
}

export default class Carousel extends React.Component<CarouselProps, CarouselState> {

    public static defaultProps: CarouselProps = {
        pageSize: Dimensions.get('window').width,
        index: 0,
        loop: true,
        autoplay: true,
        autoplayTimeout: 5000,
        slipFactor: 1,
        showsPageIndicator: true,
        pageIndicatorOffset: 16,
        animation: (animate, toValue) => {
            return Animated.spring(animate, {
                toValue: toValue,
                friction: 10,
                tension: 50,
                useNativeDriver: false
            });
        }
    };

    private scrollView: ScrollView;

    private autoPlayTimer: number = 0;
    private pageAnimation: Animated.CompositeAnimation;
    private panResponder: PanResponderInstance;
    private currentIndex: number = 0;
    private panStartIndex: number = 0;
    private panOffsetFactor: number = 0;

    constructor(props) {
        super(props);
        this.state = {
            scrollValue: new Animated.Value(0)
        };
    }

    public UNSAFE_componentWillMount() {
        this.panResponder = PanResponder.create({
            onStartShouldSetPanResponder: () => {
                this.startPanResponder();
                return true;
            },
            onMoveShouldSetPanResponder: (e, g) => {
                if (Math.abs(g.dx) > Math.abs(g.dy)) {
                    this.startPanResponder();
                    return true;
                } else {
                    return false;
                }
            },
            onPanResponderTerminationRequest: () => {
                return false;
            },
            onPanResponderGrant: () => {
                this.startPanResponder();
            },
            onPanResponderStart: (e, g) => {
                this.startPanResponder();
            },
            onPanResponderMove: (e, g) => {
                this.panOffsetFactor = this.computePanOffset(g);
                this.gotoPage(this.panStartIndex + this.panOffsetFactor, false);
            },
            onPanResponderEnd: (e, g) => {
                this.endPanResponder(g);
                this.scrollView.scrollTo({ x: 0, animated: false });
            }
        });
    }

    public componentDidMount() {
        if (this.props.autoplay) {
            this.startAutoPlay();
        }
        this.gotoPage(this.props.index + (this.props.loop ? 1 : 0), false);
    }

    public UNSAFE_componentWillReceiveProps(nextProps: CarouselProps) {
        if (nextProps.autoplay) {
            this.startAutoPlay();
        } else {
            this.stopAutoPlay();
        }
    }

    private startAutoPlay() {
        this.stopAutoPlay();
        if (!this.autoPlayTimer) {
            this.autoPlayTimer = setInterval(() => {
                this.gotoNextPage();
            }, this.props.autoplayTimeout);
        }
    }
    private stopAutoPlay() {
        if (this.autoPlayTimer) {
            clearInterval(this.autoPlayTimer);
            this.autoPlayTimer = 0;
        }
    }

    private computePanOffset(g: PanResponderGestureState) {
        let offset = -g.dx / (this.props.pageSize / this.props.slipFactor);
        if (Math.abs(offset) > 1) {
            offset = offset > 1 ? 1 : -1;
        }
        return offset;
    }

    private startPanResponder() {
        this.stopAutoPlay();
        this.panStartIndex = this.currentIndex;
        this.panOffsetFactor = 0;
        if (this.pageAnimation) {
            const index = this.currentIndex;
            this.pageAnimation.stop();
            this.gotoPage(index);
        }
    }

    private endPanResponder(g: PanResponderGestureState) {
        if (this.props.autoplay) {
            this.startAutoPlay();
        }
        let newIndex = this.currentIndex;
        this.panOffsetFactor = this.computePanOffset(g);
        if (this.panOffsetFactor > 0.5 || (this.panOffsetFactor > 0 && g.vx <= -0.1)) {
            newIndex = Math.floor(this.currentIndex + 1);
        } else if (this.panOffsetFactor < -0.5 || (this.panOffsetFactor < 0 && g.vx >= 0.1)) {
            newIndex = Math.ceil(this.currentIndex - 1);
        } else {
            newIndex = Math.round(this.currentIndex);
        }

        if (this.currentIndex === newIndex) {
            return;
        }
        this.gotoPage(newIndex);
    }

    private gotoNextPage(animated: boolean = true) {
        const childrenNum = this.getChildrenNum();
        if (!this.props.loop) {
            if (this.currentIndex === childrenNum - 1) {
                return;
            }
        }
        this.gotoPage(Math.floor(this.currentIndex) + 1);
    }

    private gotoPage(index: number, animated: boolean = true, cb = () => { }) {
        const childrenNum = this.getChildrenNum();
        if (childrenNum <= 1) {
            return cb();
        }
        if (index < 0) {
            index = 0;
        }
        if (index > childrenNum - 1) {
            index = childrenNum - 1;
        }

        const setIndex = (index: number) => {
            this.currentIndex = index;
            if (this.props.onPageChanged && Number.isInteger(this.currentIndex)) {
                this.props.onPageChanged(this.getCurrentPage());
            }
        };

        if (animated) {
            this.pageAnimation = this.props.animation(this.state.scrollValue, index);
            const animationId = this.state.scrollValue.addListener((state: { value: number }) => {
                setIndex(state.value);
            });
            this.pageAnimation.start(() => {
                this.state.scrollValue.removeListener(animationId);
                setIndex(index);
                this.pageAnimation = null;
                this.loopJump();
                cb();
            });
        } else {
            this.state.scrollValue.setValue(index);
            setIndex(index);
            this.loopJump();
            cb();
        }
    }

    /**
     * -0.5 <= pageIndex <= (pages.length - 1 + 0.5)
     */
    public getCurrentPage() {
        const childrenNum = this.getChildrenNum();
        if (childrenNum <= 1) {
            return childrenNum;
        }

        const index = this.currentIndex;
        if (this.props.loop) {
            if (index < 0.5) {
                return index + childrenNum - 2 - 1;
            } else if (index > childrenNum - 2 + 0.5) {
                return index - childrenNum + 1;
            } else {
                return index - 1;
            }
        } else {
            return index;
        }
    }

    private loopJump() {
        if (!this.props.loop) {
            return;
        }
        const childrenNum = this.getChildrenNum();
        if (childrenNum <= 1) {
            return;
        }
        if (this.currentIndex === 0) {
            this.gotoPage(childrenNum - 2, false);
        } else if (this.currentIndex === (childrenNum - 1)) {
            this.gotoPage(1, false);
        }
    }

    private getChildrenNum() {
        const { children, loop } = this.props;
        let pages = React.Children.toArray(children);
        if (pages.length < 2) {
            return 1;
        }
        if (loop) {
            return pages.length + 2;
        } else {
            return pages.length;
        }
    }

    private renderIndicator(config: PageIndicatorConfig) {
        if (!this.props.showsPageIndicator) {
            return null;
        }
        if (this.props.renderPageIndicator) {
            return this.props.renderPageIndicator(config);
        }

        const { childrenNum, pageNum, loop, scrollValue } = config;
        if (pageNum === 0) {
            return null;
        }

        const indicators: JSX.Element[] = [];
        for (let i = 0; i < pageNum; i++) {
            indicators.push(<View key={i} style={[styles.pageIndicatorStyle, this.props.pageIndicatorStyle]} />);
        }

        const offset = this.props.pageIndicatorOffset;

        let left: Animated.AnimatedInterpolation;

        if (pageNum === 1) {
            left = this.state.scrollValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0]
            });
        } else if (!loop) {
            left = this.state.scrollValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0, offset]
            });
        } else {
            left = this.state.scrollValue.interpolate({
                inputRange: [0, 1, 2, childrenNum - 2, childrenNum - 1],
                outputRange: [0, 0, offset, offset * (childrenNum - 3), offset * (childrenNum - 3)]
            });
        }

        return (
            <View style={[styles.pageIndicatorContainerStyle, this.props.pageIndicatorContainerStyle]}>
                {indicators}
                <Animated.View
                    style={[
                        styles.pageIndicatorStyle, styles.activePageIndicatorStyle,
                        this.props.pageIndicatorStyle, this.props.activePageIndicatorStyle,
                        { left: left }
                    ]}
                />
            </View>
        );
    }

    public render() {
        const { children, pageSize, loop } = this.props;
        const { scrollValue } = this.state;

        let pages = React.Children.toArray(children);
        const pageNum = pages.length;
        if (loop && pages.length > 1) {
            pages.unshift(pages[pages.length - 1]);
            pages.push(pages[1]);
        }

        pages = pages.map((page, index) => {
            return (
                <View key={index} style={{ width: pageSize }}>
                    {page}
                </View>
            );
        });

        const childrenNum = pages.length;
        let content: JSX.Element;

        if (childrenNum < 1) {
            content = null;
        } else {
            const translateX = scrollValue.interpolate({
                inputRange: [0, 1, childrenNum],
                outputRange: [0, -pageSize, -childrenNum * pageSize]
            });
            content = (
                <Animated.View
                    style={{ flexDirection: 'row', width: pageSize * childrenNum, transform: [{ translateX }] }}
                    {...this.panResponder.panHandlers}

                >
                    {pages}
                </Animated.View>
            );
        }

        return (
            <View>
                <ScrollView
                    ref={ref => this.scrollView = ref as any}
                    style={{ width: pageSize }}
                    contentContainerStyle={{ width: pageSize + 1 }}
                    horizontal
                    pagingEnabled
                    directionalLockEnabled
                    bounces={false}
                    alwaysBounceHorizontal={false}
                    alwaysBounceVertical={false}
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                    scrollEnabled={Platform.OS === 'ios' ? true : false}
                >
                    {content}
                </ScrollView>
                {this.renderIndicator({ childrenNum, pageNum, loop, scrollValue })}
            </View>
        );
    }
}

const styles = StyleSheet.create({
    pageIndicatorStyle: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginHorizontal: 5,
        backgroundColor: 'rgba(0,0,0,.4)'
    } as ViewStyle,
    activePageIndicatorStyle: {
        position: 'absolute',
        backgroundColor: '#ffc81f',
    } as ViewStyle,
    pageIndicatorContainerStyle: {
        position: 'absolute',
        alignSelf: 'center',
        flexDirection: 'row',
        bottom: 10
    } as ViewStyle
});
