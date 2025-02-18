import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { fetchUserSpots } from '../../store/spots';
import { useEffect } from 'react';
// import ConfirmDeleteSpotModal from '../ConfirmDeleteSpotModal/ConfirmDeleteModal';
// import { useModal } from '../../context/Modal';
import user from './UserSpotsPage.module.css'

function UserSpotsPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate()

    const userSpots = useSelector((state) => state.spots.userSpots)

    console.log("USER SPOTS!!!", userSpots)

    useEffect(() => {
        dispatch(fetchUserSpots());
    }, [dispatch]);

    if (!userSpots.length) {
        return (
            <div className={user.userSpotsContainer}>
                <h1 className={user.h1}>Manage Your Spots</h1>
                <h2 className={user.h2}>Bro has no spots 😔</h2>
                <button 
                    className={user.newSpotButton} 
                    type='button'
                    onClick={() => navigate('/spots/new')}
                >
                    Create a New Spot
                </button>
            </div>
        )
    }

    return (
        <div className={user.userSpotsContainer}>
            <h1 className={user.h1}>Manage Your Spots</h1>
            <button 
                className={user.newSpotButton} 
                type='button'
                onClick={() => navigate('/spots/new')}
            >
                Create a New Spot
            </button>
            <div className={user.spotsContainer}>
                {userSpots.length > 0 ? (
                    userSpots.map((spot) => {
                        return (
                            <div
                                key={spot.id}
                                className={user.spotCard}
                                title={spot.name}
                            >
                                <Link to={`/spots/${spot.id}`}>
                                    <img src={spot.previewImage} alt={spot.name} className={user.spotImage} />
                                    <div className={user.spotDetails}>
                                        <div className={user.spotTop}>
                                            <div className={user.spotLocation}>
                                                {spot.city}, {spot.state}
                                            </div>
                                            <div className={user.spotRating}>⭐ {spot.avgRating ? spot.avgRating : "New"}</div>
                                        </div>
                                        <div className={user.spotPrice}>${spot.price} night</div>
                                    </div>
                                </Link>
                                <div className={user.userSpotBtns}>
                                    <button 
                                        type='button' 
                                        className={user.spotUpdateBtn}
                                        onClick={() => handleUpdate(spot.id)}
                                    >
                                        Update
                                    </button>
                                    <button 
                                        type='button' 
                                        className={user.spotDeleteBtn} 
                                        onClick={() => handleDelete(spot.id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>    
                        );
                    })
                ) : (
                    <div className={user.error}>No spots available</div>
                )}
            </div>
        </div>
    );
}

export default UserSpotsPage;