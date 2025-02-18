import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getAllSpots } from "../../store/spots";
import lan from "./LandingPage.module.css"

function LandingPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [isLoaded, setIsLoaded] = useState(false);
    const { spots, loading, errors } = useSelector((state) => state.spots);

    useEffect(() => {
        dispatch(getAllSpots()).then(() => {
            setIsLoaded(true);
        });
    }, [dispatch]);
    

    if (loading || !isLoaded) {
        return <div className={lan.loading}>Loading...</div>;
    }

    if (errors) {
        return <div className={lan.error}>Error: {errors}</div>;
    }

    console.log("ALL THE SPOTS!!!!:", spots);

    return (
        <div className={lan.mainContainer}>
            <div className={lan.spotsContainer}>
                {spots.length > 0 ? (
                    spots.map((spot) => (
                        <div
                            key={spot.id}
                            title={spot.name}
                            className={lan.spotCard}
                        >
                            <div onClick={() => navigate("")}>
                                <img className={lan.spotImage} src={spot.previewImage} alt={spot.name} />
                                <div className={lan.spotDetails}>
                                    <div className={lan.spotTop}>
                                        <div className={lan.spotLocation}>
                                            {spot.city}, {spot.state}
                                        </div>
                                        <div className={lan.spotRating}>
                                            ⭐ {spot.avgRating ? spot.avgRating : "0.00"}

                                        </div>
                                    </div>
                                    <div className={lan.spotPrice}>
                                        ${spot.price} / night
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div>No spots available</div>
                )}
            </div>
        </div>
    )
}

export default LandingPage;