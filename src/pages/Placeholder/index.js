import React from 'react';
import jaronPicture from '../../assets/getting-ready.jpg';
import venmoLogo from '../../assets/venmo.png';
import Map from '../../components/Map';

const Placeholder = () => {
  const location = {
    address: '156 East 550 North Bountiful, UT 84010',
    lat: 40.89523,
    lng: -111.87739,
  };

  return (
    <>
      <div className="bg-white mt-8 md:w-2/3 m-auto">
        <div className="p-8">
          <div className="md:flex">
            <img className="md:w-1/2" src={jaronPicture} alt="cooking pizza" />
            <div className="bg-slate-200 rounded-md ml-8 p-8 text-lg">
              <p>
                Hey, my name is Jaron, and I{' '}
                <span className="italic">really</span> enjoy making pizza! I
                have an amazing Gozney Dome that rolls about 850° and cooks a
                pizza in about 90 seconds.
              </p>
              <p className="mt-8">
                I'll be setup every <span className="font-bold">Friday</span>{' '}
                (rain or shine) from{' '}
                <span className="font-bold">5:30pm-7pm</span> with my delicious
                homemade sauce and dough. Each pizza is $5, feel free to Venmo
                or bring cash.
              </p>
              <div className="flex justify-center mt-4">
                <div className="mt-auto mb-auto">
                  <a
                    href="https://goo.gl/maps/sQ3ZoUpVgMqc2aZg8"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <div className="pointer-events-auto text-xl decoration-red-600 underline font-bold">
                      Directions to my backyard!
                    </div>
                  </a>
                </div>
              </div>
              <div className="flex justify-center">
                <a
                  href="https://account.venmo.com/u/Jaron-Johnson-4"
                  target="_blank"
                  rel="noreferrer"
                >
                  <img className="w-14" src={venmoLogo} alt="Jaron Venmo" />
                </a>
              </div>
            </div>
          </div>
        </div>
        <script
          src="https://cdn.jsdelivr.net/npm/publicalbum@latest/embed-ui.min.js"
          async
        ></script>
        <div
          className="pa-carousel-widget"
          style={{ width: '100%', height: 480, display: 'none' }}
          data-link="https://photos.app.goo.gl/VhX7haevqzFb8KiB6"
          data-title="Backyard Brick Oven Pizzas"
          data-description="8 new items added to shared album"
          data-delay="3"
          data-background-color="#FFFFFF"
        >
          <object
            data="https://lh3.googleusercontent.com/1nScQz5K7Tx-X0iourjePf3MOrevr7d5jbR3Z0n0d1C9NKDGIa139AyFcBo8HaHJF4JICoSzf1TwNu08Xe3MaTOhVz5l_yvlm_AHIfyN7xA80NM9YWIIvaG1IW1Ua_rgms-kQUjLQ8Q=w1920-h1080"
            aria-label="https://lh3.googleusercontent.com/1nScQz5K7Tx-X0iourjePf3MOrevr7d5jbR3Z0n0d1C9NKDGIa139AyFcBo8HaHJF4JICoSzf1TwNu08Xe3MaTOhVz5l_yvlm_AHIfyN7xA80NM9YWIIvaG1IW1Ua_rgms-kQUjLQ8Q=w1920-h1080"
          ></object>
          <object
            data="https://lh3.googleusercontent.com/cGQG0UjgT5zzgBatklWjO_E3mGX0wzBaOLTLquGvFTPETMLTFPjraRH8eRPI1NSYZK8GWqwZrBIFIIjT4RpTx3kY9G8RvZPZ8oG2WaK1h79rzR8Sab7GXzFQfSDWLwn3CYb5QeJ3QyA=w1920-h1080"
            aria-label="https://lh3.googleusercontent.com/cGQG0UjgT5zzgBatklWjO_E3mGX0wzBaOLTLquGvFTPETMLTFPjraRH8eRPI1NSYZK8GWqwZrBIFIIjT4RpTx3kY9G8RvZPZ8oG2WaK1h79rzR8Sab7GXzFQfSDWLwn3CYb5QeJ3QyA=w1920-h1080"
          ></object>
          <object
            data="https://lh3.googleusercontent.com/FOLI8sLciTE-KuS0u4IRNZLWqeL1NHzEaY67KupHeaw8Gy9vZVWU7PRdfMcN64MSoauOY0T-JUUkt9QxRCdYB8FXLD8aXDNEAzrBwYylYMnJzLlh6M-E9SubGgzUzw_iqF0aT8iWE-M=w1920-h1080"
            aria-label="https://lh3.googleusercontent.com/FOLI8sLciTE-KuS0u4IRNZLWqeL1NHzEaY67KupHeaw8Gy9vZVWU7PRdfMcN64MSoauOY0T-JUUkt9QxRCdYB8FXLD8aXDNEAzrBwYylYMnJzLlh6M-E9SubGgzUzw_iqF0aT8iWE-M=w1920-h1080"
          ></object>
          <object
            data="https://lh3.googleusercontent.com/7kbH-uhL46-y3iPQlCcdifwsdSqthJANfA2okU4oRInHs58QGMYYc484vzQ6vSndLMAh4cpUuNe7xAPl7_Kz1B6WspbHDs7mBqqsFOnIqIyNvDQBZt7Y8ot_76icvnpbBOBj571GqiI=w1920-h1080"
            aria-label="https://lh3.googleusercontent.com/7kbH-uhL46-y3iPQlCcdifwsdSqthJANfA2okU4oRInHs58QGMYYc484vzQ6vSndLMAh4cpUuNe7xAPl7_Kz1B6WspbHDs7mBqqsFOnIqIyNvDQBZt7Y8ot_76icvnpbBOBj571GqiI=w1920-h1080"
          ></object>
          <object
            data="https://lh3.googleusercontent.com/rlJAugECVL5lIIfmblmhUCHkYaDMUd5m0NV6hUlmiE2p43e6D1rO2QEHobbQ4g-T1hF60_O5DGdRgXQcPgufqQP9JuNYjEa2qm-G2zQKlwCHprClDtx6Q0DZ6PfjC4RwOB-KcbcyfhA=w1920-h1080"
            aria-label="https://lh3.googleusercontent.com/rlJAugECVL5lIIfmblmhUCHkYaDMUd5m0NV6hUlmiE2p43e6D1rO2QEHobbQ4g-T1hF60_O5DGdRgXQcPgufqQP9JuNYjEa2qm-G2zQKlwCHprClDtx6Q0DZ6PfjC4RwOB-KcbcyfhA=w1920-h1080"
          ></object>
          <object
            data="https://lh3.googleusercontent.com/aSSm2lA2C93WR2dwYAB1FKF2JGA_ZptYw155lvVk6CxQehuGFqsY0NoL3Rx3_Ta3Q2osD74vqjre5VR4Y4J0NMG0kHu-0Wrf5VlkKepy6244-AnBI5wlHGHQS5UGZk-xKFsQCa1jNSU=w1920-h1080"
            aria-label="https://lh3.googleusercontent.com/aSSm2lA2C93WR2dwYAB1FKF2JGA_ZptYw155lvVk6CxQehuGFqsY0NoL3Rx3_Ta3Q2osD74vqjre5VR4Y4J0NMG0kHu-0Wrf5VlkKepy6244-AnBI5wlHGHQS5UGZk-xKFsQCa1jNSU=w1920-h1080"
          ></object>
          <object
            data="https://lh3.googleusercontent.com/g7nbHldU8ZHl08K8NUPjdeXH1JvS5F_Pk2rYrxRGSpItGXWvra1c7DkJP6bKJE9mlRB1hxgIfh0AJoILQyRjBfkIa1VznjqTQGq1sDuyZ-F-BtjklZY3ObbuKN73Lyxw54eilUqMHH8=w1920-h1080"
            aria-label="https://lh3.googleusercontent.com/g7nbHldU8ZHl08K8NUPjdeXH1JvS5F_Pk2rYrxRGSpItGXWvra1c7DkJP6bKJE9mlRB1hxgIfh0AJoILQyRjBfkIa1VznjqTQGq1sDuyZ-F-BtjklZY3ObbuKN73Lyxw54eilUqMHH8=w1920-h1080"
          ></object>
          <object
            data="https://lh3.googleusercontent.com/jAIVzq2Iyk2WdmmPx3ZXqp-2J_cJtJYTk0a03fOWRd-YPH61-4uUFVUO3Blw4F11WmzThI5DkTW0gQbzdhcm0810UzxUVmGHlspSwseDmmOrMZDhyt0t_6lF9ZhnyNIh_yJFwHIhFJY=w1920-h1080"
            aria-label="https://lh3.googleusercontent.com/jAIVzq2Iyk2WdmmPx3ZXqp-2J_cJtJYTk0a03fOWRd-YPH61-4uUFVUO3Blw4F11WmzThI5DkTW0gQbzdhcm0810UzxUVmGHlspSwseDmmOrMZDhyt0t_6lF9ZhnyNIh_yJFwHIhFJY=w1920-h1080"
          ></object>
          <object
            data="https://lh3.googleusercontent.com/RgziarQnf2y7H_Z-sqKup3qatQ7d6wqDQ1ooaTzAUfmDWtDXTPPaDev9fr42QuNO8KfjXVasnStqj3tf-fR9RpkDIcU9keyvm4HZUMB0V4dEamkOCdNa56J6oKc4cv2WAcF5LuEcjvg=w1920-h1080"
            aria-label="https://lh3.googleusercontent.com/RgziarQnf2y7H_Z-sqKup3qatQ7d6wqDQ1ooaTzAUfmDWtDXTPPaDev9fr42QuNO8KfjXVasnStqj3tf-fR9RpkDIcU9keyvm4HZUMB0V4dEamkOCdNa56J6oKc4cv2WAcF5LuEcjvg=w1920-h1080"
          ></object>
          <object
            data="https://lh3.googleusercontent.com/DNo68aQiKk3ZzZWNmeM4AXSTX781pOC7Pxs2UztR2uFsY_QJZms8Q-b1iBDO1POnvL-cg5-wEzNT8GewK-vOpIv8pWYu31qwU7we-dTm_Bh0qmz0Ao8dlNeFdniMsY0T6075q02jGn4=w1920-h1080"
            aria-label="https://lh3.googleusercontent.com/DNo68aQiKk3ZzZWNmeM4AXSTX781pOC7Pxs2UztR2uFsY_QJZms8Q-b1iBDO1POnvL-cg5-wEzNT8GewK-vOpIv8pWYu31qwU7we-dTm_Bh0qmz0Ao8dlNeFdniMsY0T6075q02jGn4=w1920-h1080"
          ></object>
          <object
            data="https://lh3.googleusercontent.com/5mbIstmKlDUF7TJJR9OBXki8LgU7yqKRWWeKVHpEEm8hp2yB_EwWLdCFFSMpLQVSRFL9EKS54O4AtL_T0J0yHR1SrNLy5cHHp6dpVxX6_odnOCMOX1oB0s1xxYK0srDa-tvwE5MVfz0=w1920-h1080"
            aria-label="https://lh3.googleusercontent.com/5mbIstmKlDUF7TJJR9OBXki8LgU7yqKRWWeKVHpEEm8hp2yB_EwWLdCFFSMpLQVSRFL9EKS54O4AtL_T0J0yHR1SrNLy5cHHp6dpVxX6_odnOCMOX1oB0s1xxYK0srDa-tvwE5MVfz0=w1920-h1080"
          ></object>
          <object
            data="https://lh3.googleusercontent.com/AEh2KINbmG2WTr4FGoAx8l4d6cn11kRKC_exIeVF3veYCRb-Ry1HTHMrMtpjXD19_t5Cxx5JZoY-P60LyODxZ6CXjlWyKLVAALQs62izV-jEAAr0hXX1uudghtYwG2MqfUqn2D6s-8Q=w1920-h1080"
            aria-label="https://lh3.googleusercontent.com/AEh2KINbmG2WTr4FGoAx8l4d6cn11kRKC_exIeVF3veYCRb-Ry1HTHMrMtpjXD19_t5Cxx5JZoY-P60LyODxZ6CXjlWyKLVAALQs62izV-jEAAr0hXX1uudghtYwG2MqfUqn2D6s-8Q=w1920-h1080"
          ></object>
        </div>

        {/* <Map location={location} zoomLevel={19} /> */}
        <p className="font-bold m-4">
          Early stage photos....Come back again later, we are still building out
          this site for ordering!
        </p>
      </div>
    </>
  );
};

export default Placeholder;
