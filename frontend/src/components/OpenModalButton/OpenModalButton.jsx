import PropTypes from 'prop-types';
import { useModal } from '../../context/Modal';

function OpenModalButton({
  modalComponent, // component to render inside the modal
  buttonText, // text of the button that opens the modal
  onButtonClick, // optional: callback function that will be called once the button that opens the modal is clicked
  onModalClose // optional: callback function that will be called once the modal is closed
}) {
  const { setModalContent, setOnModalClose } = useModal();

  const onClick = () => {
    if (onModalClose) setOnModalClose(onModalClose);
    setModalContent(modalComponent);
    if (typeof onButtonClick === "function") onButtonClick();
  };

  return <button onClick={onClick}>{buttonText}</button>;
};

OpenModalButton.propTypes = {
  modalComponent: PropTypes.element.isRequired,
  buttonText: PropTypes.string.isRequired,
  onButtonClick: PropTypes.func.isRequired,
  onModalClose: PropTypes.func.isRequired,
};

export default OpenModalButton;
