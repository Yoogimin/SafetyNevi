document.addEventListener('DOMContentLoaded', function() {
    // 모달 제어 함수
    const bindModal = (openBtnId, modalId, closeXId, closeNoId, closeYesId, checkboxId) => {
        const openBtn = document.getElementById(openBtnId);
        const modal = document.getElementById(modalId);
        const closeX = document.getElementById(closeXId);
        const closeNo = document.getElementById(closeNoId);
        const closeYes = document.getElementById(closeYesId);
        const checkbox = document.getElementById(checkboxId);

        if(openBtn) openBtn.addEventListener('click', (e) => { e.preventDefault(); modal.style.display = 'flex'; });
        if(closeX) closeX.addEventListener('click', () => modal.style.display = 'none');

        if(closeNo) closeNo.addEventListener('click', (e) => {
            e.preventDefault();
            modal.style.display = 'none';
            checkbox.checked = false;
            if(window.updateAgreementState) window.updateAgreementState(); // step.js의 함수 호출
        });

        if(closeYes) closeYes.addEventListener('click', (e) => {
            e.preventDefault();
            modal.style.display = 'none';
            checkbox.checked = true;
            if(window.updateAgreementState) window.updateAgreementState(); // step.js의 함수 호출
        });
    };

    bindModal('open-modal-btn', 'agreement-modal', 'close-modal-x', 'close-modal-no', 'close-modal-yes', 'agreement_required');
    bindModal('open-loc-modal-btn', 'location-modal', 'close-loc-modal-x', 'close-loc-modal-no', 'close-loc-modal-yes', 'location_agreement');
});