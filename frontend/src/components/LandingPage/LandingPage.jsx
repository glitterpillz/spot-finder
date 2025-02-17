import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
// import { useNavigate } from "react-router-dom";
import { getAllSpots } from "../../store/spots";

function LandingPage() {
    const dispatch = useDispatch();
    // const navigate = useNavigate();
    const [isLoaded, setIsLoaded] = useState(false);
    const { spots, loading, errors } = useSelector((state) => state.spots);

    useEffect(() => {
        dispatch(getAllSpots()).then(() => {
            setIsLoaded(true);
        });
    }, [dispatch]);
    

    if (loading || !isLoaded) {
        return <div>Loading...</div>;
    }

    if (errors) {
        return <div>Error: {errors}</div>;
    }

    console.log("ALL THE SPOTS!!!!:", spots);

    return (
        <div className="spots-container">
            {spots.length > 0 ? (
                spots.map((spot) => (
                    <div
                        key={spot.id}
                        title={spot.name}
                    >
                        <div>
                            <img src={spot.previewImage} alt={spot.name} />
                            <div className="spot-details">
                                <div className="spot-top">
                                    <div className="spot-location">
                                        {spot.city}, {spot.state}
                                    </div>
                                    <div className="spot-rating">
                                        ⭐ {spot.avgRating ? spot.avgRating : "0.00"}

                                    </div>
                                </div>
                                <div className="spot-price">
                                    ${spot.price} night
                                </div>
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <div>No spots available</div>
            )}
        </div>
    )
}

export default LandingPage;