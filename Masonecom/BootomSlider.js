const BottomBannerSlider = () => {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollViewRef = useRef();
    const currentIndex = useRef(0);
    const { width } = Dimensions.get('window');
  
    useEffect(() => {
      fetch('https://masonshop.in/api/adv_slider_api')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data?.data)) {
            setImages(data.data.map((item) => item.adv_image));
          } else if (data?.adv_image) {
            setImages([data.adv_image]);
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error("Banner API Error:", err);
          setLoading(false);
        });
    }, []);
  
    useEffect(() => {
      if (images.length === 0) return;
      const interval = setInterval(() => {
        currentIndex.current = (currentIndex.current + 1) % images.length;
        setActiveIndex(currentIndex.current);
        scrollViewRef.current?.scrollTo({
          x: currentIndex.current * width,
          animated: true,
        });
      }, 3000);
      return () => clearInterval(interval);
    }, [images]);
  
    if (loading) return null;
  
    return (
      <View style={{ marginVertical: 12 }}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          ref={scrollViewRef}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / width);
            currentIndex.current = index;
            setActiveIndex(index);
          }}
        >
          {images.map((img, i) => (
            <Card key={i} style={{ width, borderRadius: 0 }}>
              <Card.Cover source={{ uri: img }} style={{ height: 140 }} />
            </Card>
          ))}
        </ScrollView>
  
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 5 }}>
          {images.map((_, i) => (
            <View
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: i === activeIndex ? '#000' : '#ccc',
                marginHorizontal: 3,
              }}
            />
          ))}
        </View>
      </View>
    );
  };
  